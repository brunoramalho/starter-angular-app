app.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider
            // Rota para a Home
            .when('/', {
                templateUrl : 'home.html'
            })

            // Rota para a página de erro 404
            .when('/404', {
                templateUrl : '404.html'
            })

            // Rota para página não encontrada
            .otherwise("/");

        $locationProvider.html5Mode(true);
    }
]);
