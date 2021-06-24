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
        admin: any,
        invite: any,
        use: any,
    }
    profile: {
        displayname: string;
        avatar?: boolean;
    }
    formToken: string;
    logLevel: string;
}

export default <IConfig>config;
