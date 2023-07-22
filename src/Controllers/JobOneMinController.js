import AnalyzeSummaryController from './AnalyzeSummaryController.js'


class JobOneMinController {

     static async run(MongoClient, SQLClient) {

        AnalyzeSummaryController.run(MongoClient, SQLClient)

    }

}


export default JobOneMinController 