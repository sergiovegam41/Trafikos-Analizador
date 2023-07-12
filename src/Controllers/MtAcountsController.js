import { DBNames } from "../db.js";
import MtInstansController from "./MtInstansController.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';
import util from 'util';

class MtAcountsController {

    static async getMyAcountByUserID(MongoClient, req, res, APIRestFull = true,session = null) {

        if(session == null){
           session = await SessionsController.getCurrentSession(MongoClient, req)
        }
        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let Acounts = await MtAcountsCollection.find({ user_id: session.user_id.toString() }).toArray()


        let finalData = {

            success: true,
            message: "OK",
            data: Acounts
        }

        if(APIRestFull){
            return res.send(finalData)
        }else{
            return finalData
        }
       
    }

    static async getAcountByID(MongoClient, req, res, SQLClient, APIRestFull = true, Acount = null, session = null,instans = null) {

        var acount_id = req.params.acount_id;

        // console.log(Acount.login)

        if(Acount == null){
            let AcountsCollection = MongoClient.collection(DBNames.MtAcounts);
            Acount = await AcountsCollection.findOne({ _id: ObjectID(acount_id) });
        }

        if(session == null){
            session = await SessionsController.getCurrentSession(MongoClient, req)
        }

        if (Acount.user_id.toString() == session.user_id.toString()) {

            if(instans == null){
                instans = await MtInstansController.getInstansByAcountID(MongoClient, acount_id)
            }

            try {

                const resp = await http.get(`${instans.mt5_host_url}/AccountSummary?id=${instans.connectionID}`);
                let historyOrders = await this.getHistoryOrdersByInstans(instans);

                const profitOfSmallestTrade = historyOrders.orders.reduce((prevTrade, currentTrade) => {
                    
                    if (currentTrade.profit < prevTrade.profit) {
                        return currentTrade;
                    } else {
                        return prevTrade;
                    }

                }).profit;

                let finalData= {

                    success: true,
                    message: "OK",
                    data: {

                        accountSummary: resp.data,
                        historyOrders: await this.getHistoryOrdersByInstans(instans),
                        drawnMax: profitOfSmallestTrade,
                        openedOrders: await this.getHistoryOpenedOrdersByInstans(instans),
                        TraceabilitySummary: await this.getHistoryTraceabilitySummary(acount_id, SQLClient),
                        flotanteMax: await this.getFlotanteMax(acount_id, SQLClient)

                    },

                }

                if(APIRestFull){
                    return res.send(finalData)
                }else{
                    return finalData
                }


            } catch (error) {

                if(APIRestFull){
                    return res.status(404).send('BAD_REQUEST');
                }else{
                    return null
                }

            }

        }

        if(APIRestFull){
            return res.status(404).send('BAD_REQUEST');
        }else{
            return null
        }


    }

    static async getHistoryTraceabilitySummary(acount_id, SQLClient) {

        const query = util.promisify(SQLClient.query).bind(SQLClient);
        const results = await query("SELECT *, CAST(balance AS FLOAT) - CAST(equity AS FLOAT) AS flotante FROM summary_detail_users WHERE account_id = '" + acount_id + "' AND DATE(created_at) = CURDATE() LIMIT 20;");
        return results;

    }
    static async getFlotanteMax(acount_id, SQLClient) {

        const query = util.promisify(SQLClient.query).bind(SQLClient);
        const results = await query("SELECT balance - equity AS flotante FROM summary_detail_users WHERE account_id = '" + acount_id + "' order by flotante desc LIMIT 1 ;");
        // console.log(results);
        return results[0];

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