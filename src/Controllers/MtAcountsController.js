import { DBNames } from "../db.js";
import { MtInstans } from '../models/MtInstans.js';
import MtInstansController from "./MtInstansController.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
// import { PROYECT_NAME } from '../config.js'
import { ObjectId } from 'mongodb';


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

    static async createAccountsDemoOfChallenger(DatabaseClient, req, res) {

        const { servidor, broker, challenger_id, usuario } = req.body;

        const mt5_host_url = await MtInstansController.takeMtInstans(DatabaseClient, MtInstans.mt5);
        const { access } = (await http.get(`${mt5_host_url}/Search?company=${broker}`)).data
            .find(company => company.company === broker)
            .results.find(result => result.name === servidor);

        const [host, port] = access[0].split(':');

        let challengers_collection = DatabaseClient.collection(DBNames.challengers);
        let challenger = await challengers_collection.findOne({ _id: ObjectId(challenger_id) });

        let MtAcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);

        for (let index = 0; index < challenger.numero_cuentas; index++) {
            let apiCreateDemo = `${mt5_host_url}/GetDemo?host=${host}&port=${port}&UserName=${usuario.user}&AccType=demo&Country=${usuario.country}&City=${usuario.city}&State=${usuario.state}&ZipCode==${usuario.zip}&Address=${usuario.address}&Phone=${usuario.phone}&Email=${usuario.email}&CompanyName=trafikos&Deposit=100000`;
            const resp = await http.get(apiCreateDemo);
            const cuenta = resp.data;

            const newAccount = {
                user_id: usuario.usuario_id.toString(),
                broker: broker,
                servidor: servidor,
                login: cuenta.login.toString(),
                password: cuenta.password,
                type: MtInstans.mt5
            };

            await MtAcountsCollection.insertOne(newAccount);
            console.log(cuenta);
        }

        return res.send({
            success: true,
            message: "OK",
            data: { servidor, broker, challenger_id, port, host, usuario, challenger }
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