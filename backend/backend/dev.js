import httpServer from "./api/index.js";
import consola from "consola";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4003;

// Start server in development mode
httpServer.listen(PORT, () => {
  consola.info(`🚀 Server started on port ${PORT}`);
  consola.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  consola.info(`💚 Health check: http://localhost:${PORT}/health`);
});
