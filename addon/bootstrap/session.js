import ToriiSessionService from 'torii/services/torii-session';

export default function (application, sessionName) {
  var sessionFactoryName = 'service:' + sessionName;
  application.register(sessionFactoryName, ToriiSessionService);
  application.inject(sessionFactoryName, 'torii', 'service:torii');
}
