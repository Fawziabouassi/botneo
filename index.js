const Binance = require("binance-api-node").default;
const axios = require("axios");
const FormData = require("form-data");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const limiter = new RateLimiterMemory({
  points: 10,
  duration: 60, // 60 seconds
});

var client = [];
var useremail = [];
let ultimosPrecios = {};
let compras = [];
var monto = [];
let clientbaseprecision = [];
var maxmonto = [];
let porcentajeGain = [];
let porcentajeCambio = [];
var websocketmain = [];
var revisarifcanbuy = [];

// variables que se cambian
const superid = [121];

async function comprarMoneda(moneda, precioActual, user, index) {
  console.log(revisarifcanbuy[index]);
  if (revisarifcanbuy[index] === true) {
    revisarifcanbuy[index] = false;
    // Espera el tiempo que sea necesario para respetar el límite de tasa
    try {
      await limiter.consume(3);
    } catch (error) {
      console.log(error);
    }
    //console.log(moneda, precioActual, user);
    var par = moneda + "USDT";
    var bodyFormData = new FormData();
    bodyFormData.append("id", superid[index]);
    bodyFormData.append("user", user);
    bodyFormData.append("symbol", par);
    bodyFormData.append(
      "jwt",
      "$2y$10$kkAQaLYGmeVmtqVTC45a5change.U0useringpQdd4ZHPoXjjdatinfoeXMVODuVOQVDAryfneoUOBRoinruplaniboQWA"
    );
    axios({
      method: "post",
      url: "https://api2bot.neomaster.app/bot_actions/get_info_moneda_gastada.php",
      data: bodyFormData,
    })
      .then(async function (response) {
        //console.log(response.data);
        let precision = clientbaseprecision[index].symbols
          .find((coin) => coin.symbol === moneda + "USDT")
          .filters.find((filtro) => filtro.filterType === "LOT_SIZE")
          .stepSize.toString();
        let separar1 = precision.split(".");
        let separate1 = separar1[1].split("1");
        let cointpre = separate1[0].length + 1;
        let awaitinfo = await client[index].accountInfo();
        const balance = parseFloat(
          awaitinfo.balances.find((balance) => balance.asset === "USDT").free
        );
        let newmaxmonto = parseFloat(monto[index]) + parseFloat(response.data);
        console.log('balance:', balance, 'monto:', monto[index], 'maxmonto:', maxmonto[index], 'newmaxmonto:', newmaxmonto);
        if (
          parseFloat(balance) >= parseFloat(monto[index]) &&
          parseFloat(maxmonto[index]) >= parseFloat(newmaxmonto)
        ) {
          try {
            const symbol = moneda + "USDT";
            var newmonto = (monto[index] / precioActual).toFixed(cointpre);
            const order = await client[index].order({
              symbol: symbol,
              side: "buy",
              type: "market",
              quantity: newmonto,
            });
            // ultimosPrecios[index][symbol] = precioActual;
            // aca se guardaria en la base de datos
            // console.log(order);
            if (!compras[index]) {
              compras[index] = {};
            }
            compras[index][moneda] = {
              id: order.orderId,
              cantidad: parseFloat(newmonto),
              precio: parseFloat(order.fills[0].price),
              fecha: new Date(),
            };
            //
            var bodyFormData = new FormData();
            bodyFormData.append("orderId", order.orderId);
            bodyFormData.append("symbol", order.symbol);
            bodyFormData.append("clientOrderId", order.clientOrderId);
            bodyFormData.append("orderListId", order.orderListId);
            bodyFormData.append("transactTime", order.transactTime);
            bodyFormData.append("price", order.price);
            bodyFormData.append("origQty", order.origQty);
            bodyFormData.append("executedQty", order.executedQty);
            bodyFormData.append(
              "cummulativeQuoteQty",
              order.cummulativeQuoteQty
            );
            bodyFormData.append("status", order.status);
            bodyFormData.append("timeInForce", order.timeInForce);
            bodyFormData.append("type", order.type);
            bodyFormData.append("side", order.side);
            bodyFormData.append("priceFill", order.fills[0].price);
            bodyFormData.append("qtyFill", order.fills[0].qty);
            bodyFormData.append("commissionFill", order.fills[0].commission);
            bodyFormData.append(
              "commissionAssetFill",
              order.fills[0].commissionAsset
            );
            bodyFormData.append("tradeIdFill", order.fills[0].tradeId);
            bodyFormData.append("user", user);
            bodyFormData.append(
              "jwt",
              "$2y$10$kkAQaLYGmeVmtqVTC45a5change.U0useringpQdd4ZHPoXjjdatinfoeXMVODuVOQVDAryfneoUOBRoinruplaniboQWA"
            );
            axios({
              method: "post",
              url: "https://api2bot.neomaster.app/bot_actions/save_compra.php",
              data: bodyFormData,
            })
              .then(function (response) {
                //console.log(response.data);
                revisarifcanbuy[index] = true;
              })
              .catch(function (error) {
                console.log(error);
                revisarifcanbuy[index] = true;
              });
          } catch (error) {
            console.log(error);
            revisarifcanbuy[index] = true;
          }
        }
      })
      .catch(function (error) {
        console.log(error);
        revisarifcanbuy[index] = true;
      });
  }
}

async function venderCompra(moneda, user, precio, index) {
  let precision = clientbaseprecision[index].symbols
    .find((coin) => coin.symbol === moneda + "USDT")
    .filters.find((filtro) => filtro.filterType === "LOT_SIZE")
    .stepSize.toString();
  let separar1 = precision.split(".");
  let separate1 = separar1[1].split("1");
  let cointpre = separate1[0].length + 1;
  const symbol = moneda + "USDT";
  // cerrar operacion
  try {
    var bodyFormData = new FormData();
    bodyFormData.append("symbol", symbol);
    bodyFormData.append("price", precio);
    bodyFormData.append("porcentajeGain", porcentajeGain[index]);
    bodyFormData.append("user", user);
    bodyFormData.append(
      "jwt",
      "$2y$10$kkAQaLYGmeVmtqVTC45a5change.U0useringpQdd4ZHPoXjjdatinfoeXMVODuVOQVDAryfneoUOBRoinruplaniboQWA"
    );
    axios({
      method: "post",
      url: "https://api2bot.neomaster.app/bot_actions/save_venta.php",
      data: bodyFormData,
    })
      .then(function (response) {
        //console.log(response.data);
        console.log("cerrar");
      })
      .catch(function (error) {
        console.log(error);
      });
    // aca se actualizaria el estado de la operacion en la base de datos
    delete compras[index][moneda];
  } catch (error) {
    console.log(error);
  }
}

async function revisarCompras(user, precioActual, moneda, index) {
  if (!compras[index]) {
    compras[index] = {};
  }
  if (compras[index][moneda]) {
    const ganancia =
      ((precioActual - compras[index][moneda].precio) /
        compras[index][moneda].precio) *
      100;
    if (ganancia >= porcentajeGain[index]) {
      // console.log('ganancia');
      await venderCompra(moneda, user, precioActual, index);
    }
  } else {
    console.log("no hay compras");
  }
  //}
}

async function manejarDatos(data, index) {
  const symbol = data.symbol;
  var precioActual = 0;
  if (!ultimosPrecios[index]) {
    ultimosPrecios[index] = {};
  }
  /* if (data.bidDepth[0]) {
    precioActual = parseFloat(data.bidDepth[0].price);
  } else {
    precioActual = parseFloat(data.askDepth[0].price);
  } */
  precioActual = parseFloat(data.close);
  const ultimoPrecio = ultimosPrecios[index][symbol];
  // console.log(ultimoPrecio, precioActual);
  var checkit =  Math.abs(((ultimoPrecio - precioActual) / ultimoPrecio) * 100);
  if (
    ultimoPrecio && checkit >= porcentajeCambio[index]
  ) {
    const moneda = symbol.slice(0, -4);
    // Validación para evitar compras seguidas al mismo precio
    if (ultimoPrecio !== precioActual) {
      console.log('ultimoprecio: ', ultimoPrecio, 'precioActual: ', precioActual, 'porcentaje: ', checkit, 'porcentajeCambio: ', porcentajeCambio[index]);
      await revisarCompras(useremail[index], precioActual, moneda, index);
      await comprarMoneda(moneda, precioActual, useremail[index], index);
      // Actualizar el último precio de compra realizado
      ultimosPrecios[index][symbol] = precioActual;
    }
  }
  if (!ultimosPrecios[index][symbol]) {
    var bodyFormData = new FormData();
    bodyFormData.append("user", useremail[index]);
    bodyFormData.append("symbol", symbol);
    bodyFormData.append(
      "jwt",
      "$2y$10$kkAQaLYGmeVmtqVTC45a5change.U0useringpQdd4ZHPoXjjdatinfoeXMVODuVOQVDAryfneoUOBRoinruplaniboQWA"
    );
    axios({
      method: "post",
      url: "https://api2bot.neomaster.app/bot_actions/get_last_open_operation.php",
      data: bodyFormData,
    })
      .then(function (response) {
        ultimosPrecios[index][symbol] = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
    //ultimosPrecios[index][symbol] =  1;
  }
  // console.log(symbol, index);
}

async function conectarseAlWebsocket(
  publickey,
  privatekey,
  email,
  info,
  max,
  index
) {
  client[index] = Binance({
    apiKey: publickey,
    apiSecret: privatekey,
  });
  revisarifcanbuy[index] = true;
  useremail[index] = email;
  if (parseFloat(info.compra_minima) > 15) {
    monto[index] = info.compra_minima;
  } else {
    monto[index] = 15;
  }
  if (info.seleccionadas == "" || info.seleccionadas.length === 0) {
    var symbols = ["BTCUSDT"];
  } else {
    var symbols = info.seleccionadas;
  }
  porcentajeGain[index] = parseFloat(info.gain);
  porcentajeCambio[index] = parseFloat(info.cambio);
  maxmonto[index] = max;
  // agregar aquí los símbolos de los pares de monedas que deseas monitorear
  clientbaseprecision[index] = await client[index].exchangeInfo();
  websocketmain[index] = client[index].ws.candles(symbols, '1m', (data) => {
    manejarDatos(data, index);
  });
}

function startbot(idsuper, index) {
  var bodyFormData = new FormData();
  bodyFormData.append("id", idsuper);
  bodyFormData.append(
    "jwt",
    "$2y$10$kkAQaLYGmeVmtqVTC45a5change.U0useringpQdd4ZHPoXjjdatinfoeXMVODuVOQVDAryfneoUOBRoinruplaniboQWA"
  );
  axios({
    method: "post",
    url: "https://api2bot.neomaster.app/bot_actions/get_info_by_id.php",
    data: bodyFormData,
  })
    .then(function (response) {
      conectarseAlWebsocket(
        response.data.llaves.publickey,
        response.data.llaves.privatekey,
        response.data.llaves.user,
        response.data.info,
        response.data.max,
        index
      );
    })
    .catch(function (error) {
      setTimeout(() => {
        startbot(idsuper, index);
      }, 1000 * 60 * 60 * 24);
    });
}

function startbotForArray(superids) {
  for (let i = 0; i < superids.length; i++) {
    startbot(superids[i], i);
  }
}

startbotForArray(superid);
