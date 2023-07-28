// import mysql from 'mysql2'
import { DBNames } from './../db.js';
import http from 'axios';
import { ObjectID } from 'mongodb';
import MtInstansController from "./MtInstansController.js";
import { Journeys } from "../models/JourneysStatus.js";

class AnalyzeSummaryController {

    static async run(MongoClient, SQLClient) {

        console.log("AnalyzeSummaryController@run");

        let AcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        // let Acounts = await AcountsCollection.find({ connectionID: { $exists: true, $ne: null } }).toArray();


        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray();

        for (const element of journeys) {


            console.log(element._id)
          let Acount = await AcountsCollection.findOne({ _id: ObjectID(element.current_account) })
        
          if(Acount){


            let instans = await MtInstansController.getInstansByAcountID(MongoClient, Acount._id)

            let resp
            try {

                resp = await http.get(`${instans.mt5_host_url}/AccountSummary?id=${instans.connectionID}`);

            } catch (error) {

                console.log("[Fallo]")
                await AcountsCollection.updateOne({ _id: ObjectID(Acount._id) }, { $set: { mt5_host_url: null, connectionID: null } });

                // console.log(Acount)

            }

            if (resp) {


                SQLClient.query(
                    "INSERT INTO `summary_detail_users` (`id`, `balance`, `equity`, `account_id`, `created_at`) VALUES (NULL, '" + resp.data.balance + "', '" + resp.data.equity + "', '" + element._id + "', CURRENT_TIMESTAMP); ",
                    function (err, results, fields) {

                        console.log("[Success]")

                    }
                );

            }

          }else{
            console.log("no")

          }
         
        
        }
       
    }
}

export default AnalyzeSummaryController 