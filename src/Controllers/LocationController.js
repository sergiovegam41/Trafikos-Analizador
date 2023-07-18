import { DBNames } from './../db.js';


class LocationController {

  static async getCodeCountries(MongoClient, req, res) {

    let codeCountriesCollection = MongoClient.collection(DBNames.codigo_paises);

    let codeCountries = await codeCountriesCollection.find({}).sort({phone_code: 1}).toArray()

    return res.send({

      success: true,
      message: "OK",
      data: codeCountries

    })

  }

  static async getCountries(MongoClient, req, res) {

    let countriesCollection = MongoClient.collection(DBNames.countries);

    let countries = await countriesCollection.find({}).toArray()

    return res.send({

      success: true,
      message: "OK",
      data: countries

    })

  }

  static async getFullLocationByIDs(MongoClient, req, res) {

    let countriesCollection = MongoClient.collection(DBNames.countries);
    let statesCollection = MongoClient.collection(DBNames.states);
    let citiesCollection = MongoClient.collection(DBNames.cities);

    var idCountri = req.params.idCountri;
    var idState = req.params.idState;
    var idCity = req.params.idCity;

    let countries = await countriesCollection.find({ id: parseInt(idCountri) }).toArray()
    let state = await statesCollection.find({ id: parseInt(idState) }).toArray()
    let cities = await citiesCollection.find({ id: parseInt(idCity) }).toArray()


    return res.send({

      success: true,
      message: "OK",
      data: { countries, state, cities }

    })
  }

  static async getStatesByCountrieID(MongoClient, req, res) {

    let statesCollection = MongoClient.collection(DBNames.states);

    var id = req.params.id;
    let departaments = await statesCollection.find({ id_country: parseInt(id) }).toArray()

    return res.send({

      success: true,
      message: "OK",
      data: departaments
    })

  }

  static async getCitiesByEtateID(MongoClient, req, res) {

    let citiesCollection = MongoClient.collection(DBNames.cities);

    var id = req.params.id;
    let cities = await citiesCollection.find({ id_state: parseInt(id) }).toArray()

    return res.send({

      success: true,
      message: "OK",
      data: cities
    })

  }

}



export default LocationController 