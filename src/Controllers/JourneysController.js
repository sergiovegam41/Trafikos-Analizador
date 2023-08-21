import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID, ObjectId } from 'mongodb';
import moment from "moment";
import util from "util";
// import fs  from "fs ";
import vm from "vm";
import MtInstansController from "./MtInstansController.js";
import MtAcountsController from "./MtAcountsController.js";
import { MtInstans } from '../models/MtInstans.js';

import EmailsController from './EmailsController.js';

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
            // console.log(journey)
            if (journey.status == Journeys.unestarted) {
                console.log('3')
                let phases_colelction = MongoClient.collection(DBNames.phases);
                console.log('3')
                let phase = await phases_colelction.findOne({ _id: ObjectID(journey.current_phase) });
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
                        date_finish_min: fechaActual.clone().add((diasASumarMin), 'days'),
                        started_date: moment()
                    }
                });

                let cuentas_collection = MongoClient.collection(DBNames.MtAcounts);
                let cuenta = await cuentas_collection.findOne({ _id: ObjectID(journey.current_account) });

                let users_copy_collection = MongoClient.collection(DBNames.user_copy);
                let user_copy = await users_copy_collection.findOne({ user_mysql_id: cuenta.user_id });


                EmailsController.sendMailInitJourney(cuenta, user_copy.email);

                return res.send({
                    success: true,
                    message: "OK",
                    data: { "title": "Cuenta Inicializada!", "message": 'Las credenciales se han enviado por correo electronico. Tambien estaran presentes en el menu Suscripciones del sistema.' }
                })
            } else {
                console.log('4')
                return res.send({
                    success: true,
                    message: "FAIL",
                    data: { "title": "La Cuenta ya estaba inicializado", "message": 'Error al inicializar' }
                })
            }
        } catch (error) {
            return res.send({
                success: false,
                message: "FAIL",
                data: { "message": "error al inicializar Cuenta." }
            })
        }

    }



    static async validateWinAllJourneys(MongoClient, SQLClient, SQLClient2) {

        // traemos los viajes pendientes para validar
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        // los recorremos
        for (const element of journeys) {
            console.log('~ Validar Winers ~')
            console.log('~ Validar Winers 22 ~')

            // obtenemos la fecha minima de fin de la fase
            // console.log(element.date_finish_min)
            const dateFinishMin = moment(element.date_finish_min);
            // obtenemos la fecha actual
            const now = moment();

            // console.log(dateFinishMin)
            // console.log(now)
            // validamos si la fecha de fin es menor a la fecha actual
            // const isValidDate = dateFinishMin.isSameOrAfter(now);
            const isValidDate = dateFinishMin.isBefore(now);
            console.log(isValidDate)


            // Validar solo los journeys que tienen los dias minimos tradeados
            if (isValidDate) {
                console.log('[EN_RANGO_DE_FECHAS]')

                // traemos la fase del viaje actual
                let phases_colelction = MongoClient.collection(DBNames.phases);
                let phase = await phases_colelction.findOne({ _id: ObjectID(element.current_phase) });

                // traemos la cuenta del viaje actual
                let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
                let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(element.current_account) });

                // obtenemos la instancia de la cuenta atual
                const instans_acc_act = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());
                console.log('valGan')
                // obtenemos los AccountSummary de la cuenta actual para validar el profit
                const resp = await http.get(`${instans_acc_act.mt5_host_url}/AccountSummary?id=${instans_acc_act.connectionID}`);

                // Se valida si el jurnie cumple con el profit para ganar la fase
                console.log('valGan')
                console.log(phase)
                console.log('valGan')
                console.log(resp.data)
                if (resp.data.profit >= phase.require_profit) {
                    console.log('[CUMPLE_CON_EL_PROFIT_MINIMO]')

                    // ponemos el viaje actual como ganado y le damos una fecha de win
                    await journeys_collection.updateOne({ _id: element._id }, {
                        $set: {
                            status: Journeys.pendiente,
                            wined_date: moment(),

                        }
                    });

                    console.log('[JOURNEY_WIN]')

                    let NextPhase = null;
                    if (!phase.is_production) {
                        // si la fase actual no es la fase de produccion obtenemos la siguiente fase
                        NextPhase = await phases_colelction.findOne({ challenge_id: element.challenger_id, sortin: (parseInt(phase.sortin) + 1).toString() });
                    } else {
                        // si la fase actual es la fase de produccion definimos la siguiente fase como la actual
                        NextPhase = phase;
                    }

                    if (!NextPhase.is_production) {
                        console.log('[FASE_DEMO]')
                        // fase normal
                        console.log(account_by_journey.user_id)
                        // obtenemos la copia del usuario en mongodb
                        let CopyUserCollection = MongoClient.collection(DBNames.user_copy);
                        let user_copy = await CopyUserCollection.findOne({ user_mysql_id: (account_by_journey.user_id) });
                        console.log(user_copy)
                        if (user_copy) {
                            try {
                                // creamos un objeto con el servidor, el broker actual, y el usuario
                                const server = { server: account_by_journey.servidor, broker: account_by_journey.broker };
                                const data = { server, user_copy };

                                // creamos una cuenta demo en la api mt5
                                let cuenta = await MtAcountsController.createAccountDemo(MongoClient, data)

                                // creamos la cuenta en mongodb
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

                                // creamos un nuevo viaje con la fase actual y en estado UNESTARTED
                                const newJourney = {
                                    current_phase: NextPhase._id.toString(),
                                    status: Journeys.unestarted,
                                    active: 1,
                                    current_account: current_Account_Demo.insertedId.toString(),
                                    challenger_id: element.challenger_id,
                                    inscription_id: element.inscription_id
                                };
                                await journeys_collection.insertOne(newJourney);

                                console.log('[JOURNEY_READY_unestarted]')
                            } catch (error) {
                                console.log('[ERROR]')
                                console.log('~ al crear la cuenta y journie')
                            }
                            //TODO: MANDAR CORREO DE QUE GANO LA FASE ANTERIOR, Y YA ESTA LISTO PARA INICAR LA SIGUIENTE FASE
                            EmailsController.sendMailNextJourney(user_copy.email, { name: user_copy.name, fase_name: phase.name, challenger_name: (await MongoClient.collection(DBNames.challengers).findOne({ _id: ObjectID(phase.challenge_id) })).name, acount_login: account_by_journey.login });


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
                    console.log('no profit')
                }

            } else {

                console.log('[NO_ESTA_EN_RANGO]')

            }

        }
    }

    static async validateFailAllJourneys(MongoClient, SQLClient, SQLClient2) {
        console.log('JOURNEYS');
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        // console.log(journeys)


        for (const element of journeys) {
            let val = await this.validateOne(MongoClient, SQLClient, element, SQLClient2);
            // console.log(val)
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

    static async validateFailUTCordersOpenAllJourneys(MongoClient) {
        console.log('validateFailUTCordersOpenAllJourneys');
        let journeys_collection = MongoClient.collection(DBNames.journey);
        let journeys = await journeys_collection.find({ status: Journeys.pendiente }).toArray()

        for (const element of journeys) {

            // obtener la validacion de ordenes abiertas a las 00:00 UTC de esta cuenta
            let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
            let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectId(element.current_account) });

            // console.log(element._id)
            // console.log(account_by_journey)

            const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());

            let validationUTC = await MtAcountsController.validateOrdersInProgressAfterUTC(MongoClient,
                account_by_journey._id.toString(),
                '00:00', instans);

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

        console.log('[NO HAY ORDENES ABIERTAS TODO OK]');
    }

    static async validateOne(MongoClient, SQLClient, journey, SQLClient2) {
        console.log('[VALIDAR FINAL DEL VIAJE]');
        let MtAcountsCollection = MongoClient.collection(DBNames.MtAcounts);
        let account_by_journey = await MtAcountsCollection.findOne({ _id: ObjectID(journey.current_account) });

        const instans = await MtInstansController.getInstansByAcountID(MongoClient, account_by_journey._id.toString());
        // traer la cuenta del viaje actual

        const dateFinishMax = moment(journey.date_finish_max);
        const now = moment();
        const isValidDate = dateFinishMax.isBefore(now);

        console.log('[VALIDAR FINAL DEL VIAJE]');
        if (isValidDate) return { validation: false, message: 'El Reto ha concluido sin exito :(', parameter: 'time_exceeded' };
        console.log('[FINAL DEL VIAJE OK]');

        // obtener condiciones del viaje
        let conditions = await this.getConditionsJourneyByPhase(MongoClient, journey)

        // preparar colleccion de parametros
        let parametrosCollection = MongoClient.collection(DBNames.parametros);
        let AccountData = await this.getData(MongoClient, SQLClient, account_by_journey, instans)
        console.log('[DATA accsum]');
        // console.log(AccountData)
        console.log('[DATA accsum]');

        try {
            const currentDate = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            SQLClient2.query(
                `INSERT INTO data_day_to_day (profit, journey_id, created_at) VALUES (${AccountData.data.accountSummary.profit}, '${journey._id}', '${currentDate}')`,
                function (err, results, fields) {
                    console.log("[Success2]")
                }
            );
            console.log('bien')
        } catch (error) {
            console.log('mal')
        }

        let phases_colelction = MongoClient.collection(DBNames.phases);

        let challenger_collection = MongoClient.collection(DBNames.challengers);
        console.log('validateProfitNegativeLimitAcumulated')

        let phase = await phases_colelction.findOne({ _id: ObjectId(journey.current_phase) });
        let challenger = await challenger_collection.findOne({ _id: ObjectId(phase.challenge_id) });

        if (challenger.limit_profit_negative_acumulated === '1') {
            const queryAsync = util.promisify(SQLClient2.query).bind(SQLClient2);
            let validateLimitNegativeProfit = this.validateProfitNegativeLimitAcumulated(SQLClient2, journey, parseFloat(phase.drawn_acumulated_limit), queryAsync)
            if (validateLimitNegativeProfit.validation) return { validation: false, message: validateDailyTrade.message, parameter: validateDailyTrade.parameter };
        }
        console.log('validateProfitNegativeLimitAcumulate2')


        console.log('validateProfitPositiveLimitDaily')
        if (challenger.limit_profit_negative_acumulated === '1') {
            if (parseFloat(AccountData.data.accountSummary.profit) >= parseFloat(phase.profit_positive_daily_limit.toString())) return { validation: false, message: 'Limite de ganancia positiva diara alcanzada, obtuvo: ' + AccountData.data.accountSummary.profit, parameter: 'Ganancia Diaria Maxima' };
        }

        console.log(AccountData.data.accountSummary.profit)
        console.log(phase.profit_positive_daily_limit.toString())
        console.log('validateProfitPositiveLimitDaily')


        console.log('[VALIDAR TRADEO DIARIO]');
        let validateDailyTrade = await this.validateDailyTrade(MongoClient, SQLClient, AccountData, journey)

        console.log('[VALIDAR TRADEO DIARIO]');
        if (!validateDailyTrade.validation) return { validation: false, message: validateDailyTrade.message, parameter: validateDailyTrade.parameter };
        console.log('[NO TRADEO AYER]');

        // recorrer condiciones y validar
        let isFailed = false;
        let motivoFailed = '';
        let parameterFailed = '';
        for (const condition of conditions) {
            if (!isFailed) {
                console.log('[VALIDACION CONDICION]');
                let parametro = await parametrosCollection.findOne({ _id: ObjectID(condition.parameter) });
                console.log('[VALIDACION CONDICION1]');
                let valFailed = await this.isFailed(parametro.name, condition, AccountData)
                console.log('[VALIDACION CONDICION2]');
                // console.log(valFailed)
                if (valFailed.validation === true) {
                    console.log('[PERDIO ' + valFailed.message + ' ' + valFailed.parameter + ']');
                    isFailed = true;
                    motivoFailed = valFailed.message;
                    parameterFailed = valFailed.parameter;
                }
            }

        }

        console.log('[VALIDAR CONDICION PERDIDA?]');
        if (isFailed) return { validation: false, message: motivoFailed, parameter: parameterFailed };
        console.log('[NO PERDIO]');

        return { validation: true, message: 'no ha perdido', parameter: null };
    }

    static async validateProfitNegative(MongoClient, SQLClient, AccountData, journey) {

    }



    static async validateProfitNegativeLimitAcumulated(SQLClient2, journey, validation, queryAsync) {
        try {
            const query = `SELECT SUM(profit) AS total_negative_profit FROM data_day_to_day WHERE profit < 0 AND journey_id='${journey._id}'`;

            const results = await queryAsync(query)
            console.log('VAL PROFIT NEGATIVE');
            console.log(parseFloat(results[0].total_negative_profit.toString()) <= parseFloat(validation.toString()));
            console.log('VAL PROFIT NEGATIVE');

            return { validation: (parseFloat(results[0].total_negative_profit.toString()) <= parseFloat(validation.toString())), message: 'Limite de ganancia negativa alcanzada', parameter: 'drawn' };
        } catch (error) {
            console.log(error)
        }
    }
    static async validateProfitPositiveLimitDaily(SQLClient2, journey, validation, queryAsync) {
        try {
            const query = `SELECT SUM(profit) AS total_negative_profit FROM data_day_to_day WHERE profit < 0 AND journey_id='${journey._id}'`;

            const results = await queryAsync(query)
            console.log('VAL PROFIT NEGATIVE');
            console.log(parseFloat(results[0].total_negative_profit.toString()) <= parseFloat(validation.toString()));
            console.log('VAL PROFIT NEGATIVE');

            return { validation: (parseFloat(results[0].total_negative_profit.toString()) <= parseFloat(validation.toString())), message: 'Limite de ganancia negativa alcanzada', parameter: 'drawn' };
        } catch (error) {
            console.log(error)
        }
    }

    static async validateProfitLimitOfNumberDays(SQLClient2) {
        // Obtén la fecha actual en formato UTC
        const fechaActual = moment().utc();

        // Resta 4 días a la fecha actual para obtener la fecha límite
        const fechaLimite = fechaActual.clone().subtract(4, 'days');

        // Convierte las fechas al formato requerido por MySQL (YYYY-MM-DD HH:mm:ss)
        const fechaActualFormatted = fechaActual.format('YYYY-MM-DD HH:mm:ss');
        const fechaLimiteFormatted = fechaLimite.format('YYYY-MM-DD HH:mm:ss');

        // Consulta para obtener los registros de los últimos 3 días
        const query = `SELECT * FROM data_day_to_day WHERE created_at >= '${fechaLimiteFormatted}' AND created_at < '${fechaActualFormatted}' and profit<0`;

        // Ejecuta la consulta
        SQLClient2.query(query, function (err, results, fields) {
            if (err) {
                console.error(err);
            } else {
                // Maneja los resultados obtenidos
                console.log('Registros de los últimos 3 días:');
                console.log(results);
                let suma = -0;
                for (const days of results) {
                    console.log(days)
                    suma += days.profit
                }

                console.log(suma)

                return results
            }
        });
    }

    // static async validateProfitLimitOfNumberDays(MongoClient, SQLClient) {
    //     console.log('si existe la funcion')

    // }


    static async validateDailyTrade(MongoClient, SQLClient, AccountData, journey) {
        // console.log('p1');
        const dateStarted_date = moment(journey.started_date);
        // obtenemos la fecha actual
        // console.log('p1');
        const now = moment();
        // console.log('p1');
        // validamos si la fecha de fin es menor a la fecha actual
        const isValidDate = dateStarted_date.isBefore(now);
        // console.log('p1');
        if (isValidDate) {
            // console.log('p1');
            const orders = AccountData.data.historyOrders.orders;
            // console.log('p1');
            // console.log('VAL ORDERS');
            // console.log(orders);
            // console.log('VAL ORDERS');



            // Obtener fecha/hora de inicio y fin del día anterior
            const start = moment().utc().subtract(1, 'day').startOf('day').add(1, 'minute');
            // console.log('p1');
            const end = moment().utc().subtract(1, 'day').endOf('day');
            // console.log('p1');
            // Filtrar órdenes 
            const yesterdayOrders = orders.filter(order => {
                const orderTime = moment.utc(order.openTime);
                return orderTime.isBetween(start, end);
            });
            // console.log('p1');

            // const yesterdayOrders2 = orders.filter(order => {
            //     const orderTime = moment(order.openTime);
            //     return orderTime.isBetween(start, end);
            // });
            return { validation: yesterdayOrders.length > 0, message: 'Inactividad de tradeo', parameter: 'inactivity' };
        }

        return { validation: true, message: 'bien', parameter: 'ninguno' };


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
        try {
            console.log('parametro')
            console.log('[VALIDACION ISFAILED]');

            let b = null;

            switch (parametro) {
                case 'Flotante':
                    console.log('Flotante')
                    b = AccountData.data.flotanteMax.flotante;
                case 'DrawnMax':
                    console.log('DrawnMax')
                    b = AccountData.data.drawnMax;
                case 'Equidad':
                    console.log('Equidad')
                    b = AccountData.data.accountSummary.equity;
                case 'Profit':
                    console.log('Profit')
                    b = AccountData.data.accountSummary.profit;
            }

            console.log(b)
            let ejecucion = false;
            try {
                ejecucion = (vm.runInNewContext(` ${b} ${condition.conditional} ${condition.value}`))
            } catch (error) {
                // console.log(error)
                ejecucion = false;
            }

            return { validation: ejecucion, message: `el ${parametro} es ${condition.conditional} a ${condition.value}, tienes ${b} de ${parametro}  HAZ PERDIDO :( `, parameter: parametro }
        } catch (error) {
            return { validation: false, message: `ninguno `, parameter: 'n' }
        }

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