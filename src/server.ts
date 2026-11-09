import { app } from './app.ts'

const PORT = process.env.PORT || 3334
app.listen(PORT, () => console.log(`server is runnig on port ${PORT}`))
app.listen(
  console.log('Read documentation at http://localhost:3334/docs/openapi'),
)
