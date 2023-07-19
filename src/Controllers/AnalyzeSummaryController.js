// import mysql from 'mysql2'
import { DBNames } from './../db.js';
import http from 'axios';
import { ObjectID } from 'mongodb';

class AnalyzeSummaryController {

    static async run(MongoClient, SQLClient) {



        console.log("AnalyzeSummaryController@run");

        let AcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let Acounts = await AcountsCollection.find({ connectionID: { $ne: null, $ne: "" } }).toArray();

        for (const element of Acounts) {
        
            let resp
            try {

                resp = await http.get(`${element.mt5_host_url}/AccountSummary?id=${element.connectionID}`);

            } catch (error) {

                console.log("[Fallo]")
                await AcountsCollection.updateOne({ _id: ObjectID(element._id) }, { $set: { mt5_host_url: null, connectionID: null } });

            }

            if (resp) {


                SQLClient.query(
                    "INSERT INTO `summary_detail_users` (`id`, `balance`, `equity`, `account_id`, `created_at`) VALUES (NULL, '" + resp.data.balance + "', '" + resp.data.equity + "', '" + element._id + "', CURRENT_TIMESTAMP); ",
                    function (err, results, fields) {

                        // console.log("[Success]")

                    }
                );

            }
        
        }
       
    }
}

export default AnalyzeSummaryController 