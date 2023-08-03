import MtAcountsController from '../MtAcountsController.js';
import MtInstansController from "../MtInstansController.js";
import SessionsController from "../SessionsController.js";
import { DBNames } from "../../db.js";
import { ObjectID } from 'mongodb';


class SoketAnalizadorBots {
    static analize = "analizeBots"

    static async run(io, clientSocket, MongoClient, SQLClient, data) {

        let session = await SessionsController.getCurrentSession(MongoClient, {headers:{authorization: data.token}})
        let MTAcounts = await MtAcountsController.getAccountsBots(MongoClient, false,session)
        let CurrentAcount = MTAcounts.data[0]

        if (!CurrentAcount) {
            return;
        }
        let CurrentInstans = await MtInstansController.getInstansByAcountID(MongoClient, CurrentAcount._id)

        clientSocket.on("client:" + this.analize + ":change_account", async (data) => {

            let result = MTAcounts.data.find(cuenta => cuenta.login === data.login);
            console.log("[Changue]")
            if (result) {
                CurrentAcount = result
                CurrentInstans = await MtInstansController.getInstansByAcountID(MongoClient, CurrentAcount._id)

            }

        })

        clientSocket.emit("server:init", { success: true, code: "", msj: "", initData: MTAcounts })

        this.emitData(io, clientSocket, MongoClient, SQLClient, data, CurrentAcount, CurrentInstans)

        const intervalId = setInterval(async () => {
            this.emitData(io, clientSocket, MongoClient, SQLClient, data, CurrentAcount, CurrentInstans)
        }, 3000);


        clientSocket.on('disconnect', () => {

            console.log('Client disconnected');
            clearInterval(intervalId);

        });

    }

    static async emitData(io, clientSocket, MongoClient, SQLClient, data, Acount, instans) {

        console.log("[emitDAta]")
        let resp = await MtAcountsController.getDataAcountByID(
            MongoClient,
            {
                params: {
                    acount_id: Acount._id.toString()
                }
            },
            null,
            SQLClient,
            false,
            Acount,
            instans
        )
        console.log("[good]")

        if (resp) {
            // SQLClient.query(
            //     "INSERT INTO `summary_detail_users` (`id`, `balance`, `equity`, `account_id`, `created_at`) VALUES (NULL, '" + resp.data.accountSummary.balance + "', '" + resp.data.accountSummary.equity + "', '" + Acount._id.toString() + "', CURRENT_TIMESTAMP); ",
            //     function (err, results, fields) { }
            // );

            SQLClient.query(
                "INSERT INTO `trading_accounts_bots` (`id`, `balance`, `equity`, `account_id`, `created_at`) VALUES (NULL, '" + resp.data.accountSummary.balance + "', '" + resp.data.accountSummary.equity + "', '" + Acount._id.toString() + "', CURRENT_TIMESTAMP); ",
                function (err, results, fields) {

                    console.log("[Success2]")

                }
            );

        }
console.log(resp);

        clientSocket.emit("server:" + this.analize + ":data", resp)

    }



}

export default SoketAnalizadorBots 