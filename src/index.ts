import Axios from 'axios';
import { errorLogs } from 'utils/hack';
import { DataUpdater } from 'utils/dataUpdater';

const updater = new DataUpdater();

try {
  await updater.start();
} catch (error) {
  console.error(error);
  const { IFTTT_EVENT_KEY } = process.env;
  if (IFTTT_EVENT_KEY && errorLogs.length) {
    const [event, key] = IFTTT_EVENT_KEY.split(':');
    await Axios.post(`https://maker.ifttt.com/trigger/${event}/with/key/${key}`, {
      value1: errorLogs.join('\n'),
    }).catch(console.error);
  }
}
