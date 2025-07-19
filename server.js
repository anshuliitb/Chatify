import server from "./app.js";
import connectToDB from "./src/config/mongoose.js";

const startServer = async () => {
  try {
    await connectToDB();
    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`✅ Server is listening at port: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();
