import { DBNames } from './../db.js';


class SessionsController{


    static async getCurrentSession(DatabaseClient,req){
        let session_token = (req.headers.authorization||"").replace('Bearer ', '');
        let session_tokensCollection = DatabaseClient.collection(DBNames.session_tokens);
        let session = await session_tokensCollection.findOne({ session_token });
        return session
    }

}





export default SessionsController 