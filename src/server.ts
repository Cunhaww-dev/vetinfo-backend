import { app } from './app.ts'

const PORT = process.env.PORT || 3334
app.listen(PORT, () => {
  console.log(`server is runnig on port ${PORT}`)
  if (process.env.NODE_ENV !== 'production')
    console.log(`Read documentation at http://localhost:${PORT}/docs`)
})
