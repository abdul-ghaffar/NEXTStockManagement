export interface IElectronAPI {
    getNetworkUrl: () => Promise<string>;
}

declare global {
    interface Window {
        api: IElectronAPI;
    }
}
