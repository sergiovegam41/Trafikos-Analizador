import { DBNames } from "../db.js";
import SessionsController from "./SessionsController.js";
import http from 'axios';
import { ObjectID } from 'mongodb';


class InscriptionsController {

    static async createAccountDemo(req, res) {

        let session = await SessionsController.getCurrentSession(DatabaseClient, req)
        let MtAcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);
        let Acounts = await MtAcountsCollection.find({ user_id: session.user_id.toString() }).toArray()

        // return res.send({
        //     success: true,
        //     message: "OK",
        //     data: Acounts
        // })

        // const MtAcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);

        try {
            const result = await MtAcountsCollection.insertOne({
                name: name,
                balance: balance,
                user_id: user_id
            });
            return res.status(200).send({
                success: true,
                message: "Account created successfully",
                data: result.insertedId
            });
        } catch (err) {
            return res.status(500).send({
                success: false,
                message: "Error creating account",
                error: err.message
            });
        }
    }

}

export default InscriptionsController  