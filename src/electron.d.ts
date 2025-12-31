export interface IElectronAPI {
    getNetworkUrl: () => Promise<string>;
    printOrder: (htmlContent: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
    interface Window {
        api: IElectronAPI;
    }
}
