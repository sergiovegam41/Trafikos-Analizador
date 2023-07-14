import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';
import moment from "moment";

import { Journeys } from "../models/JourneysStatus.js";

class JourneysController {

    static async inizialiteByAccount(MongoClient, req, current_Account_Demo) {

        const { challenger_id, inscription_id } = req.body;

        let phases_colelction = MongoClient.collection(DBNames.phases);
        let phase = await phases_colelction.findOne({ challenge_id: challenger_id, sortin: "0" });
        // console.log(challenger_id);
        const diasASumarMin = parseInt(phase.duration_min);
        const diasASumarMax = parseInt(phase.duration_max);
        let fechaActual = moment();
        console.log(fechaActual);
        console.log(diasASumarMax, fechaActual.clone().add(diasASumarMax, 'days'))
        console.log(diasASumarMin, fechaActual.clone().add(diasASumarMin, 'days'))

        let journeys_collection = MongoClient.collection(DBNames.journey);
        const newJourney = {
            current_phase: phase._id.toString(),
            status: Journeys.pendiente,
            active: 1,
            current_account: current_Account_Demo.insertedId.toString(),
            challenger_id: challenger_id,
            inscription_id: inscription_id,
            date_finish_max: fechaActual.clone().add(diasASumarMax, 'days'),
            date_finish_min: fechaActual.clone().add(diasASumarMin, 'days')
        };

        const journey_insert = await journeys_collection.insertOne(newJourney);

        return journey_insert;
    }

}

export default JourneysController  