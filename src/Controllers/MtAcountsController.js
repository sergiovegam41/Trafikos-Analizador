import { DBNames } from "../db.js";
import MtInstansController from "./MtInstansController.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';


class MtAcountsController {


    static async getMyAcountByUserID(DatabaseClient, req, res) {

        let session = await SessionsController.getCurrentSession(DatabaseClient, req)
        let MtAcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);
        let Acounts = await MtAcountsCollection.find({ user_id: session.user_id.toString() }).toArray()

        return res.send({

            success: true,
            message: "OK",
            data: Acounts
        })
    }




    static async getAcountByID(DatabaseClient, req, res) {

        var acount_id = req.params.acount_id;

        let AcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);
        let Acount = await AcountsCollection.findOne({ _id: ObjectID(acount_id) });
        let session = await SessionsController.getCurrentSession(DatabaseClient, req)

        if (Acount.user_id.toString() == session.user_id.toString()) {

            let instans = await MtInstansController.getInstansByAcountID(DatabaseClient, acount_id)

            try {

                const resp = await http.get(`${instans.mt5_host_url}/AccountSummary?id=${instans.connectionID}`);
                return res.send({

                    success: true,
                    message: "OK",
                    data: {
                        accountSummary: resp.data,
                        historyOrders: await this.getHistoryOrdersByInstans(instans),
                        openedOrders: await this.getHistoryOpenedOrdersByInstans(instans)
                    },
                })

            } catch (error) {

                return res.status(500).send(error);

            }

        }

        return res.status(404).send('BAD_REQUEST');



    }

    static async getHistoryOrdersByInstans(instans) {

        const resp = await http.get(`${instans.mt5_host_url}/OrderHistory?id=${instans.connectionID}`);
        return resp.data;

    }

    static async getHistoryOpenedOrdersByInstans(instans) {

        const resp = await http.get(`${instans.mt5_host_url}/OpenedOrders?id=${instans.connectionID}`);
        return resp.data;

    }



}

export default MtAcountsController 