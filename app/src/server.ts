import app from './app';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "localhost", () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

