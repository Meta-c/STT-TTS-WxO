window.__WXO_CONFIG={"title":"IBM watsonx Orchestrate","context_root":"\u002Fmfe_home","skills_catalog":"\u002Fconfigure\u002Fskills\u002F","skills_catalog_mfe_path":"\u002Fmfe_catalog","tabs":{"chat":true,"editor":false,"explorer":true,"settings":false,"nlq_help":true},"prefs":{"reasoning":false,"notifications":true,"dismiss_notification_timeout":10000,"feedback_enabled":false},"files":{"max_upload_size_bytes":20971520,"max_upload_size_bytes_excel":1048576},"namespaces":{},"isWxAWebchat":false,"deployment_platform":"saas","wxo_domain_url":"https:\u002F\u002Fus-south.watson-orchestrate.cloud.ibm.com\u002Fmfe_home_archer\u002Fapi\u002Fv1","wxo_builder_url":"https:\u002F\u002Fus-south.watson-orchestrate.cloud.ibm.com\u002Fmfe_builder\u002Fapi\u002Fv1","wxo_socket_url":"https:\u002F\u002Fus-south.watson-orchestrate.cloud.ibm.com","catalog_server_url":"https:\u002F\u002Fus-south.watson-orchestrate.cloud.ibm.com\u002Fv1","connection_manager_url":"","orchestrator_agent_name":"","standalone":false,"stream_timeout":"120000","enable_websocket":true,"tenant_id":"","slack_auth_url":"https:\u002F\u002Fslack.com\u002Foauth\u002Fv2\u002Fauthorize","slack_app_id":"A08QA2SADKN","slack_client_id":"7954679816677.8826094353668","file_upload_max_attempts":150,"file_upload_retry_interval":2000,"jwks_url":"","embed":true};
/**
 * IBM Confidential
 * OCO Source Materials
 * (C) Copyright IBM Corp. 2025
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has been
 * deposited with the U.S. Copyright Office
 *
 * @name wxoLoader
 * @description wxoLoader script loads the wxO webclient in the embed scenario.
 */

var wxoLoader = (function () {
    let jsFiles = ["/wxochat/static/js/main.13305d134bbc01348349.js"];
    let cssFiles = ["/wxochat/static/css/main.f3de5367.css"];

    init = () => {
        if (!validateConfig()) {
            return;
        }
        loadCssFiles();
        setTimeout(function () {
            loadJsFiles();
        }, 50);
    };

    var validateConfig = () => {
        let errorCount = 0;
        let component = 'Config error';
        if (!getHostUrl()) {
            reportError(component, ' hostURL is mandatory.');
            errorCount++;
        }
        if (!getOrchetrationId()) {
            reportError(component, 'orchestrationID is mandatory.');
            errorCount++;
        }
        if (!getRootElement()) {
            // reportError(component, "rootElementId is mandatory.");
            errorCount++;
        }

        if (!getAgentId()) {
            reportError(component, 'agentId is mandatory.');
            errorCount++;
        }

        if (!getAgentEnvironmentId()) {
            reportError(component, 'agentEnvironmentId is mandatory.');
            errorCount++;
        }

        return errorCount === 0;
    };

    var reportError = (component, message) => {
        let error_prefix = 'wxO error';
        let delimter = ' ::: ';
        let style = 'background: #dd4a68; color: #ffffff';
        console.log('%c ' + error_prefix + delimter + component + delimter + message + delimter, style);
    };

    var loadCssFiles = () => cssFiles.forEach((value) => loadCss(value));
    var loadJsFiles = () => jsFiles.forEach((value) => loadScript(value));

    const getHostUrl = () => window.wxOConfiguration?.hostURL || window.wxOConfiguration?.hostUrl || null;

    var getOrchetrationId = () => (window.wxOConfiguration?.orchestrationID ? window.wxOConfiguration.orchestrationID : null);

    var getAgentId = () => (window.wxOConfiguration?.chatOptions?.agentId ? window.wxOConfiguration?.chatOptions?.agentId : null);

    var getAgentEnvironmentId = () =>
        window.wxOConfiguration?.chatOptions?.agentEnvironmentId ? window.wxOConfiguration?.chatOptions?.agentEnvironmentId : null;

    var getRootElement = () => {
        // When rootElementId is not provided, use default value WACCRoot
        const rootElementId = window.wxOConfiguration?.rootElementID || window.wxOConfiguration?.rootElementId || 'WACCRoot';
        if (!document.getElementById(rootElementId)) {
            console.log(`new element is getting created now with ID ${rootElementId}`);
            const elmDiv = document.createElement('div');
            elmDiv.setAttribute('id', rootElementId);
            document.body.appendChild(elmDiv);
        }
        localStorage.setItem('rootElementId', rootElementId);
        return true;
    };

    var loadScript = (url) => {
        let host = getHostUrl();
        const t = document.createElement('script');
        t.src = host + url;
        document.head.appendChild(t);
    };

    var loadCss = (url) => {
        let host = getHostUrl();
        const t = document.createElement('link');
        t.rel = 'stylesheet';
        t.href = host + url;
        document.head.appendChild(t);
    };

    return { init };
})();