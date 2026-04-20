import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { LucideAngularModule, Bug, CheckSquare, BookOpen, Zap, Bookmark } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([errorInterceptor]),
            withInterceptorsFromDi()
        ),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        importProvidersFrom(
            LucideAngularModule.pick({ Bug, CheckSquare, BookOpen, Zap, Bookmark })
            )
    ]
};