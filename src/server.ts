import { app } from './app.ts';

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`server is runnig on port ${PORT}`));
