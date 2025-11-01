import * as osu from 'node-os-utils';
import { green, yellow, cyan } from 'colorette';

export const startMonitoring = () => {
  setInterval(async () => {
    try {
      const cpu = osu.cpu;
      const mem = osu.mem;

      const cpuUsage = await cpu.usage();
      const memInfo = await mem.info();

      console.clear();
      console.log(cyan('=== Sistema Monitor ==='));
      console.log(yellow('CPU Usage:'), green(`${cpuUsage.toFixed(2)}%`));
      console.log(yellow('Memory Usage:'), green(`${(100 - memInfo.freeMemPercentage).toFixed(2)}%`));
      console.log(yellow('Free Memory:'), green(`${memInfo.freeMemMb}MB`));
      console.log(yellow('Total Memory:'), green(`${memInfo.totalMemMb}MB`));
      console.log(cyan('====================='));
    } catch (error) {
      console.error('Erro ao monitorar recursos:', error);
    }
  }, 1000);
}; 