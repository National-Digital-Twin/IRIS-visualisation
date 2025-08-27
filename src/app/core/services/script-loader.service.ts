import { DOCUMENT } from '@angular/common';
import { Injectable, WritableSignal, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScriptLoaderService {
    public scripts: WritableSignal<Record<string, boolean>> = signal<Record<string, boolean>>({});

    private readonly document: Document = inject(DOCUMENT);

    public load(id: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.scripts()[id]) {
                resolve();
                return;
            }

            const script = this.document.createElement('script');
            script.id = id;
            script.async = true;
            script.type = 'text/javascript';
            script.src = src;

            script.onload = (): void => {
                this.scripts.update((scripts) => ({ ...scripts, [id]: true }));
                resolve();
            };

            script.onerror = (): void => {
                reject(new Error(`Failed to load script: ${src}`));
            };

            this.document.head.appendChild(script);
        });
    }

    public unload(id: string): void {
        const script = this.document.getElementById(id);
        if (script) {
            script.remove();
            this.scripts.update((scripts) => ({ ...scripts, [id]: false }));
        }
    }

    public isLoaded(id: string): boolean {
        return this.scripts()[id] || false;
    }
}
