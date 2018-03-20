const Koa = require('koa');
const Router = require('koa-router');
const hbs = require('koa-hbs');
const bodyParser = require('koa-bodyparser');
const handlebars = require('handlebars');
const handler = require('./handlers/handler');

const MongooseLayer = require('./handlers/mongoose');
const SequelizeLayer = require('./handlers/sequelize');
const SequelizePgLayer = require('./handlers/sequelize-postgres');


const app = new Koa();
const router = new Router();

app
  .use(bodyParser())
  .use(hbs.middleware({
    handlebars: handlebars,
    viewPath: __dirname + '/views'
  }))
  .use((ctx, next) => {
    ctx.set('Server', 'Koa');
    next();
  });

router
  .get('/json', (ctx) => {
    ctx.body = {message: 'Hello, World!'};
  })
  .get('/plaintext', (ctx) => {
    ctx.body = 'Hello, World!';
  });

app.use(router.routes());

const databaseLayersMapping = {
  mongoose: MongooseLayer,
  sequelize: SequelizeLayer,
  'sequelize-pg': SequelizePgLayer,
};

for (const [endpoint, layer] of Object.entries(databaseLayersMapping)) {
  const router = new Router();
  const routerHandler = handler(layer);
  router
    .prefix(`/${endpoint}`)
    .get('/db', routerHandler.SingleQuery)
    .get('/queries', routerHandler.MultipleQueries)
    .get('/fortunes', routerHandler.Fortunes)
    .get('/updates', routerHandler.Updates);

  app.use(router.routes(), router.allowedMethods());
}

app.listen(8080);
console.log(`Worker started and listening on http://0.0.0.0:8080 ${new Date().toISOString()}`);
