import AnalyzeSummaryController from './AnalyzeSummaryController.js'


class JobOneMinController {

     static async run(MongoClient, SQLClient) {
        AnalyzeSummaryController.run(MongoClient, SQLClient)
    }

    static async runAnalizeBots(MongoClient, SQLClient) {
        AnalyzeSummaryController.runAnalizeBots(MongoClient, SQLClient)
    }

}


export default JobOneMinController 