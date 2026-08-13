const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.once('error', (e) => {
      s.destroy();
      resolve(false);
    });
    s.once('connect', () => {
      s.destroy();
      resolve(true);
    });
    s.connect(port, '127.0.0.1');
  });
}

async function run() {
  const backend = await checkPort(4000);
  const mysql = await checkPort(3306);
  const frontend = await checkPort(3000);
  console.log(JSON.stringify({ backend_4000: backend, mysql_3306: mysql, frontend_3000: frontend }));
}

run();
