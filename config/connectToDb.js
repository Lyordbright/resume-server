import dotenv from "dotenv"
import mongoose from "mongoose"
dotenv.config()
const password = process.env.MONGO_PASS
const username = process.env.MONGO_USERNAME
const UriWithPass = process.env.MONGO_URI.replace("<password>", password)
const mongoUri = UriWithPass.replace("<username>", username)

const connectToDb = async () => {
    try {
        const connected = await mongoose.connect(mongoUri)
        if (connected) {
            console.log("MONGDB CONNECTED")
        }
    } catch (error) {
        console.log(error)
    }
}

export default connectToDb