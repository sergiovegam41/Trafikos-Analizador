import { DBNames } from "../db.js";
import MtInstansController from "./MtInstansController.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';
import util from 'util';
import { MtInstans } from '../models/MtInstans.js';
import JourneysController from "./JourneysController.js";
import moment from "moment";
import { Journeys } from "../models/JourneysStatus.js";
import { Console } from "console";
class MtAcountsController {

    static async getMyAcountByUserID(MongoClient, req, res, APIRestFull = true, session = null) {

        if (session == null) {
            session = await SessionsController.getCurrentSession(MongoClient, req)
        }

        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let Acounts = await MtAcountsCollection.find({ user_id: session.user_id.toString() }).toArray()


        let finalData = {

            success: true,
            message: "OK",
            data: Acounts
        }

        if (APIRestFull) {
            return res.send(finalData)
        } else {
            return finalData
        }
    }

    static async createAccountsDemoOfChallenger(MongoClient, req, res) {

        const { servidor, broker, challenger_id, usuario, inscription_id } = req.body;

        const mt5_host_url = await MtInstansController.takeMtInstans(MongoClient, MtInstans.mt5);
        const { access } = (await http.get(`${mt5_host_url}/Search?company=${broker}`)).data
            .find(company => company.company === broker)
            .results.find(result => result.name === servidor);

        const [host, port] = access[0].split(':');

        let challengers_collection = MongoClient.collection(DBNames.challengers);
        let challenger = await challengers_collection.findOne({ _id: ObjectID(challenger_id) });

        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);

        const current_Account_Demos = [];

        for (let index = 0; index < challenger.numero_cuentas; index++) {

            let cuenta = null;
            try {
                let apiCreateDemo = `${mt5_host_url}/GetDemo?host=${host}&port=${port}&UserName=${usuario.user}&AccType=demo&Country=${usuario.country}&City=${usuario.city}&State=${usuario.state}&ZipCode==${usuario.zip}&Address=${usuario.address}&Phone=${usuario.phone}&Email=${usuario.email}&CompanyName=trafikos&Deposit=100000`;

                const resp = await http.get(apiCreateDemo);
                cuenta = resp.data;
            } catch (error) {
                console.log("[ELIMINDA]")
                for (const current_Account_Demo of current_Account_Demos) {

                    await MtAcountsCollection.deleteOne({ _id: current_Account_Demo._id });
                }
                return res.send({
                    success: false,
                    message: "!OK",
                    data: { "message": "No se pudo crear la cuenta, intenta mas tarde." }
                })
            }


            const newAccount = {
                user_id: usuario.usuario_id.toString(),
                broker: broker,
                servidor: servidor,
                login: cuenta.login.toString(),
                password: cuenta.password,
                type: MtInstans.mt5
            };

            const current_Account_Demo = await MtAcountsCollection.insertOne(newAccount);
            current_Account_Demos.push(current_Account_Demo);
        }


        for (const current_Account_Demo of current_Account_Demos) {
            await JourneysController.inizialiteByAccount(MongoClient, req, current_Account_Demo);
        }

        return res.send({
            success: true,
            message: "OK",
            data: { "message": "Suscripcion Aceptada Exitosamente!!!" }
        })

    }


    static async getAcountByID(MongoClient, req, res, SQLClient, APIRestFull = true, Acount = null, session = null, instans = null) {

        var acount_id = req.params.acount_id

        if (Acount == null) {
            let AcountsCollection = MongoClient.collection(DBNames.MtAcounts);
            Acount = await AcountsCollection.findOne({ _id: ObjectID(acount_id) });
        } else {

        }

        if (session == null) {
            session = await SessionsController.getCurrentSession(MongoClient, req)
        }

        if (Acount.user_id.toString() == session.user_id.toString()) {

            if (instans == null) {
                instans = await MtInstansController.getInstansByAcountID(MongoClient, acount_id)
            }

            try {
                // console.log("resp: ")
                const resp = await http.get(`${instans.mt5_host_url}/AccountSummary?id=${instans.connectionID}`);


                let historyOrders = await this.getHistoryOrdersByInstans(instans);

                const profitOfSmallestTrade = historyOrders.orders.reduce((prevTrade, currentTrade) => {

                    if (currentTrade.profit < prevTrade.profit) {
                        return currentTrade;
                    } else {
                        return prevTrade;
                    }

                }).profit;

                let finalData = {

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

                if (APIRestFull) {
                    return res.send(finalData)
                } else {
                    return finalData
                }


            } catch (error) {
                // console.log("respc: ")

                if (APIRestFull) {
                    return res.status(404).send('BAD_REQUEST');
                } else {
                    return null
                }

            }

        }

        if (APIRestFull) {
            return res.status(404).send('BAD_REQUEST');
        } else {
            return null
        }


    }

    static async getHistoryTraceabilitySummary(acount_id, SQLClient) {

        const query = util.promisify(SQLClient.query).bind(SQLClient);
        const results = await query("SELECT *, CAST(balance AS FLOAT) - CAST(equity AS FLOAT) AS flotante FROM summary_detail_users WHERE account_id = '" + acount_id + "' order by created_at desc LIMIT 60;");
        // console.log(acount_id)
        // console.log(results)
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


    static async validateOrdersInProgressAfterUTC(MongoClient, account_id, hour, instans) {
        // obtener hora actual y hora limite en UTC
        const horaActualUtc = moment.utc().startOf('minute');
        const horaLimiteUtc = moment.utc(hour, 'HH:mm').startOf('minute');

        // retornar false en caso de que todo este ok 
        if (!horaActualUtc.isSame(horaLimiteUtc)) {
            return false;
        }

        // obtener las ordenes abiertas de la cuenta actual
        const openedOrders = await this.getHistoryOpenedOrdersByInstans(instans);

        // retornar validacion de existencia de ordenes abiertas
        return openedOrders.length > 0;
    }



}

export default MtAcountsController 