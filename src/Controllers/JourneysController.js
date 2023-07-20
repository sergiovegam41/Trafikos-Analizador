import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID, ObjectId } from 'mongodb';
import moment from "moment";
import vm from "vm";
import MtInstansController from "./MtInstansController.js";
import MtAcountsController from "./MtAcountsController.js";
import { MtInstans } from '../models/MtInstans.js';


import { Journeys } from "../models/JourneysStatus.js";

class JourneysController {
    // static journeys_collection = MongoClient.collection(DBNames.MtAcounts);

    static async createByAccount(MongoClient, req, current_Account_Demo, sortin = "0") {

        const { challenger_id, inscription_id } = req.body;

        let phases_colelction = MongoClient.collection(DBNames.phases);
        let phase = await phases_colelction.findOne({ challenge_id: challenger_id, sortin: sortin });

        let journeys_collection = MongoClient.collection(DBNames.journey);
        const newJourney = {
            current_phase: phase._id.toString(),
            status: Journeys.unestarted,
            active: 1,
            current_account: current_Account_Demo.insertedId.toString(),
            challenger_id: challenger_id,
            inscription_id: inscription_id,
            // date_finish_max: fechaActual.clone().add(diasASumarMax, 'days'),
            // date_finish_min: fechaActual.clone().add(diasASumarMin, 'days')
        };

        const journey_insert = await journeys_collection.insertOne(newJourney);

        return journey_insert;
    }

    static async inizialiteById(MongoClient, req, res, sortin = "0") {
        console.log(req.query.journey_id)
        try {
            console.log('1')
            let journeys_collection = MongoClient.collection(DBNames.journey);
            let journey = await journeys_collection.findOne({ _id: ObjectID(req.query.journey_id) });
            console.log(journey)
            if (journey.status == Journeys.unestarted) {
                console.log('3')
                let phases_colelction = MongoClient.collection(DBNames.phases);
                console.log('3')
                let phase = await phases_colelction.findOne({ _id: ObjectID(journey.current_phase)});
                console.log(phase)
                // console.log(challenger_id);
                const diasASumarMin = parseInt(phase.duration_min);
                const diasASumarMax = parseInt(phase.duration_max);
                let fechaActual = moment();

                console.log('3')

                console.log({
                    date_finish_max: fechaActual.clone().add((diasASumarMax), 'days'),
                    date_finish_min: fechaActual.clone().add((diasASumarMin), 'days')
                })

                await journeys_collection.updateOne({ _id: journey._id }, {
                    $set: {
                        status: Journeys.pendiente,
                        date_finish_max: fechaActual.clone().add((diasASumarMax), 'days'),
                        date_finish_min: fechaActual.clone().add((diasASumarMin), 'days')
                    }
                });
                return res.send({
                    success: true,
                    message: "OK",
                    data: { "message": "Viaje Inicializado." }
                })
            } else {
                console.log('4')
                return res.send({
                    success: true,
                    message: "FAIL",
                    data: { "message": "El viaje ya estaba inicializado" }
                })
            }
        } catch (error) {
            return res.send({
                success: false,
                message: "FAIL",
                data: { "message": "error al inicializar viaje." }
            })
        }

    }



    static async validateWinAllJourneys(MongoClient, SQLClient) {


        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()



        for (const element of journeys) {
            console.log('~ Validar Winers ~')


            const dateFinishMin = moment(element.date_finish_min);
            const now = moment();
            const isValidDate = dateFinishMin.isBefore(now);

            // Validar solo los journeys que tienen los dias minimos tradeados

            if (isValidDate) {

                console.log('[EN_RANGO_DE_FECHAS]')


                let phases_colelction = MongoClient.collection(DBNames.phases);
                let phase = await phases_colelction.findOne({ _id: ObjectID(element.phase_id) });

                let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
                let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(element.current_account) });
                const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());

                const resp = await http.get(`${instans.mt5_host_url}/AccountSummary?id=${instans.connectionID}`);


                // Se valida si el jurnie cumple con el profit para ganar la fase
                if (resp.data.accountSummary.profit >= phase.require_profit) {

                    console.log('[CUMPLE_CON_EL_PROFIT_MINIMO]')

                    let journeys_collection = MongoClient.collection(DBNames.journey);
                    await journeys_collection.updateOne({ _id: element._id }, {
                        $set: {
                            status: Journeys.win,
                            wined_date: moment(),

                        }
                    });

                    console.log('[JOURNEY_WIN]')


                    let NextPhase = null;

                    if (!phase.is_production) {
                        NextPhase = await phases_colelction.findOne({ challenge_id: element.challenger_id, sortin: (parseInt(phase.sortin) + 1).toString() });
                    } else {
                        NextPhase = phase;
                    }

                    // se valida cual es la siguiente phase
                    if (NextPhase) {
                        console.log('[EXISTE_SIGUIENTE_FASE]')
                        if (!NextPhase.is_production) {
                            console.log('[FASE_DEMO]')
                            let CopyUserCollection = MongoClient.collection(DBNames.MtAcounts);
                            let user_copy = await CopyUserCollection.findOne({ user_mysql_id: (account_by_journey.user_id) });

                            if (user_copy) {


                                try {
                                    const [host, port] = (await http.get(`${instans.mt5_host_url}/Search?company=${account_by_journey.broker}`)).data.find(company => company.company === account_by_journey.broker).results.find(result => result.name === account_by_journey.servidor).access[0].split(':');
                                    console.log(host, port)

                                    let apiCreateDemo = `${instans.mt5_host_url}/GetDemo?host=${host}&port=${port}&UserName=${user_copy.user}&AccType=demo&Country=${user_copy.country}&City=${user_copy.city}&State=${user_copy.state}&ZipCode==${user_copy.zip}&Address=${user_copy.address}&Phone=${user_copy.phone}&Email=${user_copy.email}&CompanyName=trafikos&Deposit=100000`;
                                    const resp = await http.get(apiCreateDemo);
                                    cuenta = resp.data;                                             

                                    const newAccount = {
                                        user_id: account_by_journey.user_id,
                                        broker: account_by_journey.broker,
                                        servidor: account_by_journey.servidor,
                                        login: cuenta.login.toString(),
                                        password: cuenta.password,
                                        type: MtInstans.mt5
                                    };


                                    const current_Account_Demo = await MtAcountsCollection.insertOne(newAccount);

                                    console.log('[CUENTA_CREADA]')

                                    const diasASumarMin = parseInt(NextPhase.duration_min);
                                    const diasASumarMax = parseInt(NextPhase.duration_max);
                                    let fechaActual = moment();

                                    const newJourney = {
                                        current_phase: NextPhase._id.toString(),
                                        status: Journeys.unestarted,
                                        active: 1,
                                        current_account: current_Account_Demo.insertedId.toString(),
                                        challenger_id: element.challenger_id,
                                        inscription_id: element.inscription_id,
                                        // date_finish_max: fechaActual.clone().add(diasASumarMax, 'days'),
                                        // date_finish_min: fechaActual.clone().add(diasASumarMin, 'days')
                                    };

                                    const journey_insert = await journeys_collection.insertOne(newJourney);

                                    console.log('[JOURNEY_READY_unestarted]')


                                } catch (error) {

                                    console.log('[ERROR]')
                                    console.log('~ al crear la cuenta y journie')
                                }

                                //TODO: MANDAR CORREO DE QUE GANO LA FASE ANTERIOR, Y YA ESTA LISTO PARA INICAR LA SIGUIENTE FASE
                            } else {
                                console.log('[ERROR]')
                                console.log('~no tiene user copy')

                            }

                        } else {
                            // TODO: GESTION PARA JOURNEY EN FASE DE PRODUCCION
                            // crear los journey sin cuentas en estado unestarted y sin fechas
                            // admin, valida y vincula las cuentas de forma manual por cada JOURNEY que tenga una fase de produccion
                            // al final el admin cambia de valida, y se cambia el estado, se agregan las fechas, se coloca en estado unestarted, para que el participante lo empieze




                        }



                    } else {
                        // TO DO IMPLEMENTAR PASO a LA ULTIMA FASE
                        // TODO CORREGIDO: IMPLEMENTAR FINAL DEL CHALLENGER
                        console.log('[CHALLENGER_COMPLETADO]')


                    }
                }
            } else {

                console.log('[NO_ESTA_EN_RANGO]')

            }

        }
    }

    static async validateFailAllJourneys(MongoClient, SQLClient) {

        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        for (const element of journeys) {
            let val = await this.validateOne(MongoClient, SQLClient, element);
            console.log(val)
            if (!val.validation) {

                let journeys_collection = MongoClient.collection(DBNames.journey);
                await journeys_collection.updateOne({ _id: element._id }, {
                    $set: {
                        status: Journeys.failed,
                        failed_message: val.message,
                        failed_parameter: val.parameter,
                        failed_date: moment()
                    }
                });

            } else {
                console.log('TODO OK');
            }
        }
    }

    static async validateOne(MongoClient, SQLClient, journey) {

        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(journey.current_account) });

        const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());
        // traer la cuenta del viaje actual


        const dateFinishMax = moment(journey.date_finish_max);
        const now = moment();
        const isValidDate = dateFinishMax.isBefore(now);

        if (isValidDate) return { validation: false, message: 'El Reto ha concluido sin exito :(', parameter: 'time_exceeded' };

        // console.log()

        // obtener la validacion de ordenes abiertas a las 00:00 UTC de esta cuenta
        let validationUTC = await MtAcountsController.validateOrdersInProgressAfterUTC(MongoClient,
            account_by_journey._id.toString(),
            '00:00', instans);

        // validacion negativa
        if (validationUTC) return { validation: false, message: 'Tienes ordenes abiertas a las 00:00UTC', parameter: 'validacion 00:00UTC' };

        // obtener condiciones del viaje
        let conditions = await this.getConditionsJourneyByPhase(MongoClient, journey)

        // preparar colleccion de parametros
        let parametrosCollection = MongoClient.collection(DBNames.parametros);
        let AccountData = await this.getData(MongoClient, SQLClient, account_by_journey, instans)

        // recorrer condiciones y validar
        let isFailed = false;
        let motivoFailed = '';
        let parameterFailed = '';
        for (const condition of conditions) {
            if (!isFailed) {
                let parametro = await parametrosCollection.findOne({ _id: ObjectID(condition.parameter) });
                let valFailed = await this.isFailed(parametro.name, condition, AccountData)
                if (valFailed.validation) {
                    isFailed = true;
                    motivoFailed = valFailed.message;
                    parameterFailed = valFailed.parameter;
                    break;
                }
            }

        }

        if (isFailed) return { validation: false, message: motivoFailed, parameter: parameterFailed };

        let validateDailyTrade = await this.validateDailyTrade(MongoClient, SQLClient, AccountData)

        if (!validateDailyTrade.validation) return { validation: false, message: validateDailyTrade.message, parameter: validateDailyTrade.parameter };

        return { validation: true, message: 'no ha perdido', parameter: null };
    }

    static async validateDailyTrade(MongoClient, SQLClient, AccountData) {

        const orders = AccountData.data.historyOrders.orders;

        // Obtener fecha/hora de inicio y fin del día anterior
        const start = moment().utc().subtract(1, 'day').startOf('day').add(1, 'minute');
        const end = moment().utc().subtract(1, 'day').endOf('day');

        // Filtrar órdenes 
        const yesterdayOrders = orders.filter(order => {
            const orderTime = moment(order.openTime);
            return orderTime.isBetween(start, end);
        });


        return { validation: yesterdayOrders.length > 0, message: 'Inactividad de tradeo', parameter: 'inactivity' };
    }

    static async getConditionsJourneyByPhase(MongoClient, journey) {
        // obtener las condiciones del viaje actual
        let conditions_controller = MongoClient.collection(DBNames.conditions);
        let conditions = await conditions_controller.find({ phase_id: journey.current_phase }).toArray()

        return conditions;
    }


    static async validateWin(MongoClient, valueWin) {

    }

    static async isFailed(parametro, condition, AccountData) {

        let b = null;
        switch (parametro) {
            case 'Flotante':
                b = AccountData.data.flotanteMax.flotante ?? 0;
            case 'DrawnMax':
                b = AccountData.data.drawnMax ?? 0;
            case 'Equidad':
                b = AccountData.data.accountSummary.equity;
            case 'Profit':
                b = AccountData.data.accountSummary.profit;
        }

        return { validation: !(vm.runInNewContext(`${condition.value} ${condition.conditional} ${b}`)), message: `el ${parametro} es ${condition.conditional} a  ${b}, HAZ PERDIDO :( `, parameter: parametro }
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