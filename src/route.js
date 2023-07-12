import LocationController from './Controllers/LocationController.js';
import MtAcountsController from './Controllers/MtAcountsController.js';
import SessionsController from './Controllers/SessionsController.js';
import JobOneMinController from './Controllers/JobOneMinController.js';
import InscriptionsController from './Controllers/InscriptionsController.js';
import Utils from './Utils/Utils.js';
import { DBNames } from './db.js';
import mysql from 'mysql2'

export default (app, DatabaseClient) => {

  // JobOneMinController.run(DatabaseClient)
  // setInterval(() => {
  //   console.log("Ejecutando cada 1 minuto");
  //   JobOneMinController.run(DatabaseClient)
  // }, 60000);
  // 60000 ms = 1 minuto

  app.get('/getCountries', async (req, res) => LocationController.getCountries(DatabaseClient, req, res))
  app.get('/getStatesByCountrieID/:id', async (req, res) => LocationController.getStatesByCountrieID(DatabaseClient, req, res))
  app.get('/getCitiesByEtateID/:id', async (req, res) => LocationController.getCitiesByEtateID(DatabaseClient, req, res))
  app.get('/getFullLocationByIDs/:idCountri/:idState/:idCity', async (req, res) => LocationController.getFullLocationByIDs(DatabaseClient, req, res))
  app.get('/ping', async function (req, res) {
    // Implement Auto clean Tokens 
    return res.send(true)
  })
  app.get('/api/getMyAcounts', validationMiddleware, async (req, res) => MtAcountsController.getMyAcountByUserID(DatabaseClient, req, res))
  app.get('/api/AccountSummary/:acount_id', validationMiddleware, async (req, res) => MtAcountsController.getAcountByID(DatabaseClient, req, res))

  app.post('/api/createAccountsDemoOfChallenger', validationMiddleware, async (req, res) => MtAcountsController.createAccountsDemoOfChallenger(DatabaseClient, req, res));

  async function validationMiddleware(req, res, next) {

    try {

      let session = await SessionsController.getCurrentSession(DatabaseClient, req)

      if (session) {

        return next()

      }

    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');

  }
}


