import { AuthorizationNotifier, AuthorizationRequest, AuthorizationResponse, AuthorizationServiceConfiguration, BaseTokenRequestHandler, BasicQueryStringUtils, FetchRequestor, GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN, LocationLike, RedirectRequestHandler, StringMap, TokenRequest, TokenResponse } from "@openid/appauth";

export class AuthHandler {
    private configuration: AuthorizationServiceConfiguration;
    private notifier: AuthorizationNotifier;
    private authorizationHandler: RedirectRequestHandler;
    private tokenHandler: BaseTokenRequestHandler;

    private request: AuthorizationRequest;
    private response: AuthorizationResponse;

    public token: TokenResponse;
    public data: any;

    private CLIENT_ID = 'test-client';
    private REDIRECT_URL = 'http://localhost:3000/';

    constructor() {
        this.notifier = new AuthorizationNotifier();
        this.authorizationHandler = new RedirectRequestHandler(undefined, new SaneQueryStringUtils());
        this.authorizationHandler.setAuthorizationNotifier(this.notifier);
        this.tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());

        this.notifier.setAuthorizationListener((request, response, error) => {
            console.log('Authorization request complete ', request, response, error);
            if (response) {
                this.request = request;
                this.response = response;
            }
        });

        AuthorizationServiceConfiguration.fetchFromIssuer("http://localhost:8080/auth/realms/nfc-staging", new FetchRequestor())
        .then(response => {
            this.configuration = response;
            this.authorizationHandler.completeAuthorizationRequestIfPossible();
        })
        .catch(error => {
            console.log('Something bad happened', error);
        });
    }

    public authorize() {
        let request = new AuthorizationRequest({
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URL,
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
            scope: 'openid',
            state: undefined,
        });
        this.authorizationHandler.performAuthorizationRequest(this.configuration, request);
    }

    public getToken(code: string) {
        let extras: StringMap|undefined = undefined;
        if (this.request && this.request.internal) {
            extras = {};
            extras['code_verifier'] = this.request.internal['code_verifier'];
        }
        let request = new TokenRequest({
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URL,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: code,
            extras: extras
        });

        return this.tokenHandler.performTokenRequest(this.configuration, request)
            .then(response => {
                this.token = response;
                this.setTokenData();
                console.log('Token received.');
            });
    }

    public refreshToken() {
        let request = new TokenRequest({
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URL,
            grant_type: GRANT_TYPE_REFRESH_TOKEN,
            refresh_token: this.token.refreshToken,
        });
        
        return this.tokenHandler.performTokenRequest(this.configuration, request)
            .then(response => {
                this.token = response;
                this.setTokenData();
                console.log('Token received.');
            });
    }

    private setTokenData() {
        let urlBase64Data = this.token.accessToken.split('.')[1];
        let base64 = urlBase64Data.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        this.data = JSON.parse(jsonPayload);
    }

    public isAuthenticated(): boolean {
        return this.token !== undefined;
    }

    public getHeaderValue(): string {
        return `${this.token.tokenType} ${this.token.accessToken}`;
    }
}


class SaneQueryStringUtils extends BasicQueryStringUtils {
    override parse(input: LocationLike, useHash?: boolean): StringMap {
        return super.parse(input, false);
    }
}
