import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID, ObjectId } from 'mongodb';
import moment from "moment";
// import fs  from "fs ";
import vm from "vm";
import MtInstansController from "./MtInstansController.js";
import MtAcountsController from "./MtAcountsController.js";
import { MtInstans } from '../models/MtInstans.js';

import EmailsController from './EmailsController.js';

import { Journeys } from "../models/JourneysStatus.js";

class JourneysDController2 {


    static async validateFailUTCordersOpenAllJourneys(MongoClient) {
        console.log('validateFailUTCordersOpenAllJourneys');
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        for (const element of journeys) {
         
            // obtener la validacion de ordenes abiertas a las 00:00 UTC de esta cuenta
            let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
            let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(element.current_account) });
            console.log('primero')
            const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());
            console.log(instans)
            let validationUTC = await MtAcountsController.validateOrdersInProgressAfterUTC(MongoClient,
                account_by_journey._id.toString(),
                '00:00', instans);
                console.log('primero')
            // validacion negativa
            console.log(validationUTC);
            if (validationUTC) {
                console.log('[SI HAY OREDENES ABIERTAS]');
                // await journeys_collection.updateOne({ _id: element._id }, {
                //     $set: {
                //         status: Journeys.failed,
                //         failed_message: 'Tienes ordenes abiertas a las 00:00UTC',
                //         failed_parameter: 'validacion 00:00UTC',
                //         failed_date: moment()
                //     }
                // });
            };
            console.log('[NO HAY ORDENES ABIERTAS TODO OK]');
        }
    }


    static async validateFailAllJourneys(MongoClient, SQLClient) {
        console.log('JOURNEYS');
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        for (const element of journeys) {
            let val = await this.validateOne(MongoClient, SQLClient, element);

            if (!val.validation) {
                // let journeys_collection = MongoClient.collection(DBNames.journey);
                // await journeys_collection.updateOne({ _id: element._id }, {
                //     $set: {
                //         status: Journeys.failed,
                //         failed_message: val.message,
                //         failed_parameter: val.parameter,
                //         failed_date: moment()
                //     }
                // });
                console.log('TODO MAL');
            } else {
                console.log('TODO OK');
            }
        }
    }


}

export default JourneysDController2