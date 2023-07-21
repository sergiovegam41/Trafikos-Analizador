import LocationController from './Controllers/LocationController.js';
import MtAcountsController from './Controllers/MtAcountsController.js';
import SessionsController from './Controllers/SessionsController.js';
import JourneysController from './Controllers/JourneysController.js';
// import JobOneMinController from './Controllers/JobOneMinController.js';
import cron from 'node-cron';

export default (app, MongoClient, SQLClient) => {


  // Tarea a ejecutar a las 00:00 UTC
  async function cronJob00UTC() {
    console.log('Ejecutando tarea a las 00:00 UTC.');
    await JourneysController.validateFailAllJourneys();
    await JourneysController.validateWinAllJourneys();
  }


  cron.schedule('0 0 * * *', cronJob00UTC);

  setInterval( async () => {
    console.log("Ejecutando cada 1 minuto");
    await JobOneMinController.run(MongoClient, SQLClient)

  }, 60000);
  // 60000 ms = 1 minuto

  app.get('/getCodeCountries', async (req, res) => LocationController.getCodeCountries(MongoClient, req, res))
  app.get('/getCountries', async (req, res) => LocationController.getCountries(MongoClient, req, res))
  app.get('/getStatesByCountrieID/:id', async (req, res) => LocationController.getStatesByCountrieID(MongoClient, req, res))
  app.get('/getCitiesByEtateID/:id', async (req, res) => LocationController.getCitiesByEtateID(MongoClient, req, res))
  app.get('/getFullLocationByIDs/:idCountri/:idState/:idCity', async (req, res) => LocationController.getFullLocationByIDs(MongoClient, req, res))
  // app.get('/inizialiteJourneyById', async (req, res) => JourneysController.inizialiteById(MongoClient, req, res))

  app.get('/ping', async function (req, res) {
    // Implement Auto clean Tokens 
    return res.send(true)
  })
  // app.get('/api/inizialiteJourneyById',validationMiddleware, async (req, res) => JourneysController.inizialiteById(MongoClient, req, res))

  app.get('/api/getMyAcounts', validationMiddleware, async (req, res) => MtAcountsController.getMyAcountByUserID(MongoClient, req, res))
  app.get('/api/inizialiteJourneyById', validationMiddleware, async (req, res) => JourneysController.inizialiteById(MongoClient, req, res))
  app.get('/api/AccountSummary/:acount_id', validationMiddleware, async (req, res) => JourneysController.inizialiteById(MongoClient, req, res))

  app.post('/api/createAccountsDemoOfChallenger', validationMiddleware, async (req, res) => MtAcountsController.createAccountsDemoOfChallenger(MongoClient, req, res, "0"));


  async function validationMiddleware(req, res, next) {

    try {

      let session = await SessionsController.getCurrentSession(MongoClient, req)

      if (session) {

        return next()

      }

    } catch (error) {
      return res.status(404).send('BAD_REQUEST');
    }
    return res.status(404).send('BAD_REQUEST');

  }
}


