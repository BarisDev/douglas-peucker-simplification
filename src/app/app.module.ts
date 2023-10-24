import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { LeafletComponent } from './leaflet/leaflet.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule } from '@angular/forms';

const Routes = [
    {path: '', component: LeafletComponent}
]
@NgModule({
  declarations: [
    AppComponent,
    LeafletComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(Routes),
    LeafletModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
