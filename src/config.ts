import * as config from "config";

interface IConfig {
    homeserverUrl: string;
    pantalaimon: {
        use: boolean;
        username: string;
        password: string;
    }
    accessToken: string;
    autoJoin: boolean;
    dataPath: string;
    country: string;
    permissions: {
        invite: any,
        use: any,
    }
    profile: {
        displayname: string;
        avatar?: boolean;
    }
    logLevel: string;
}

export default <IConfig>config;
