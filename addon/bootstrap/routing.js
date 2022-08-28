import ApplicationRouteMixin from 'torii/routing/application-route-mixin';
import AuthenticatedRouteMixin from 'torii/routing/authenticated-route-mixin';

var AuthenticatedRoute = null;

function reopenOrRegister(applicationInstance, factoryName, mixin) {
  const factory = applicationInstance.lookup(factoryName);

  if (factory) {
    factory.reopen(mixin);
  } else {
    const basicFactory = applicationInstance.resolveRegistration('route:basic');

    if (!AuthenticatedRoute) {
      AuthenticatedRoute = basicFactory.extend(AuthenticatedRouteMixin);
    }

    // or applicationInstance.application.register
    applicationInstance.application.register(factoryName, AuthenticatedRoute);
  }
}

export default function toriiBootstrapRouting(
  applicationInstance,
  authenticatedRoutes
) {
  reopenOrRegister(
    applicationInstance,
    'route:application',
    ApplicationRouteMixin
  );
  for (var i = 0; i < authenticatedRoutes.length; i++) {
    var routeName = authenticatedRoutes[i];
    var factoryName = 'route:' + routeName;
    reopenOrRegister(applicationInstance, factoryName, AuthenticatedRouteMixin);
  }
}
