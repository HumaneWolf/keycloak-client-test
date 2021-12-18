import { AuthorizationNotifier, AuthorizationRequest, AuthorizationResponse, AuthorizationServiceConfiguration, BaseTokenRequestHandler, BasicQueryStringUtils, FetchRequestor, GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN, LocationLike, RedirectRequestHandler, StringMap, TokenRequest, TokenResponse } from "@openid/appauth";

export class AuthHandler {
    private configuration: AuthorizationServiceConfiguration;
    private notifier: AuthorizationNotifier;
    private authorizationHandler: RedirectRequestHandler;
    private tokenHandler: BaseTokenRequestHandler;

    private request: AuthorizationRequest;
    private response: AuthorizationResponse;

    public data: TokenResponse;


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
        let request: TokenRequest|null = null;

        if (code) {
            let extras: StringMap|undefined = undefined;
            if (this.request && this.request.internal) {
                extras = {};
                extras['code_verifier'] = this.request.internal['code_verifier'];
            }
            request = new TokenRequest({
                client_id: this.CLIENT_ID,
                redirect_uri: this.REDIRECT_URL,
                grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
                code: code,
                extras: extras
            });
        } else if (this.response) {
            // use the token response to make a request for an access token
            request = new TokenRequest({
                client_id: this.CLIENT_ID,
                redirect_uri: this.REDIRECT_URL,
                grant_type: GRANT_TYPE_REFRESH_TOKEN,
                refresh_token: (this.response as any).refreshToken,
                });
        }

        this.tokenHandler.performTokenRequest(this.configuration, request)
            .then(response => {
                this.data = response;
                console.log('Token received.');
                console.log(response);
            });
    }
}


class SaneQueryStringUtils extends BasicQueryStringUtils {
    override parse(input: LocationLike, useHash?: boolean): StringMap {
        return super.parse(input, false);
    }
}
