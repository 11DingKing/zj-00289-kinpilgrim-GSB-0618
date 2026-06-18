import { createApp } from "./app";
import { seedData } from "./seed";

const app = createApp();
const PORT = process.env.PORT || 3001;

seedData();

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
