import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';
import moment from "moment";
import vm from "vm";
import MtInstansController from "./MtInstansController.js";
import MtAcountsController from "./MtAcountsController.js";

import { Journeys } from "../models/JourneysStatus.js";

class JourneysController {
    // static journeys_collection = MongoClient.collection(DBNames.MtAcounts);

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

    static async validateAllJourneys(MongoClient, SQLClient) {
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()


        for (const element of journeys) {
            console.log('----------validateOne---------------')
            let val = await this.validateOne(MongoClient, SQLClient, element);

        }


         journeys.forEach(async element => {

         

            // if (val) {
            //     console.log('bien validado')
            // } else {
            //     // terminar viaje
            //     console.log('Finalizar Viaje');
            // }

        });
    }

    static async validateOne(MongoClient, SQLClient, journey) {
    
        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(journey.current_account) });

        const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());
        console.log(instans)
        // traer la cuenta del viaje actual

        // // obtener la validacion de ordenes abiertas a las 00:00 UTC de esta cuenta
        // let validationUTC = await MtAcountsController.validateOrdersInProgressAfterUTC(MongoClient,
        //     account_by_journey._id.toString(),
        //     '00:00', instans);

        // // validacion negativa
        // if (validationUTC) return false;

        // // obtener condiciones del viaje
        // let conditions = await this.getConditionsJourneyByPhase(MongoClient, journey)

        // // preparar colleccion de parametros
        // let parametrosCollection = MongoClient.collection(DBNames.parametros);

        // // recorrer condiciones y validar
        // let isFailed = false;
        // // conditions.forEach(async condition => {
        // //     let parametro = await parametrosCollection.findOne({ _id: ObjectID(condition.parameter) });
        // //     await this.isFailed(MongoClient, SQLClient, account_by_journey, parametro.name, condition, instans)
        // // });

        // return true;
    }

    static async getConditionsJourneyByPhase(MongoClient, journey) {
        // obtener las condiciones del viaje actual
        let conditions_controller = MongoClient.collection(DBNames.conditions);
        let conditions = await conditions_controller.find({ phase_id: journey.current_phase }).toArray()

        return conditions;
    }

    static async validateWin(MongoClient, valueWin) {

    }

    static async isFailed(MongoClient, SQLClient, account_by_journey, parametro, condition, instans) {

        let resp = await this.getData(MongoClient, SQLClient, account_by_journey, instans)

        console.log('respuesta')
        console.log(resp != null ? 'condatos' : 'sindatos')

        switch (parametro) {
            case 'Flotante':
                // calcular flotante
                let b = null;
                return vm.runInNewContext(`${condition.value} ${condition.conditional} ${b}`);
            case 'DrawnMax':
            // calcular drawnMAx

            case 'Equidad':
            // calcular equidad
            case 'Profit':

            case 'Dias Minimos tardeados':

        }

        return true;
    }



    static async getData(MongoClient, SQLClient, Acount, instans) {



        let resp = await MtAcountsController.getAcountByID(
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
            { user_id: Acount.user_id },
            instans
        )

        return resp

    }

}

export default JourneysController