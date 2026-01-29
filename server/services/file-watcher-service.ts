import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import * as path from 'path';
import * as os from 'os';

export class FileWatcherService extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private plansDir: string;
  private commentsDir: string;

  constructor() {
    super();
    this.plansDir = path.join(os.homedir(), '.claude', 'plans');
    this.commentsDir = path.join(os.homedir(), '.claude', 'plan-comments');
  }

  start() {
    this.watcher = chokidar.watch([this.plansDir, this.commentsDir], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (filePath) => {
      const id = this.getIdFromPath(filePath);
      if (filePath.endsWith('.md')) {
        console.log(`Plan changed: ${id}`);
        this.emit('plan:changed', { path: filePath, id });
      } else if (filePath.endsWith('.json')) {
        console.log(`Comments changed: ${id}`);
        this.emit('comments:changed', { path: filePath, id });
      }
    });

    this.watcher.on('add', (filePath) => {
      if (filePath.endsWith('.md')) {
        const id = this.getIdFromPath(filePath);
        console.log(`Plan added: ${id}`);
        this.emit('plan:added', { path: filePath, id });
      }
    });

    this.watcher.on('unlink', (filePath) => {
      if (filePath.endsWith('.md')) {
        const id = this.getIdFromPath(filePath);
        console.log(`Plan removed: ${id}`);
        this.emit('plan:removed', { path: filePath, id });
      }
    });

    this.watcher.on('error', (error) => {
      console.error('File watcher error:', error);
    });

    console.log(`Watching for changes in:`);
    console.log(`  - ${this.plansDir}`);
    console.log(`  - ${this.commentsDir}`);
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private getIdFromPath(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }
}
