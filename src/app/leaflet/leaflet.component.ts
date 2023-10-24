import { ApplicationRef, Component, OnInit } from '@angular/core';
import { latLng, polyline, tileLayer } from 'leaflet';
import * as turf from '@turf/turf';

import '@geoman-io/leaflet-geoman-free'; 
@Component({
    selector: 'app-leaflet',
    templateUrl: './leaflet.component.html',
    styleUrls: ['./leaflet.component.css']
})
export class LeafletComponent implements OnInit {

    options: any;
    map: any;

    drawnLine: any = [];
    finalLine: any = [];
    tolerance = 100;

    firstLine: any;
    lastLine: any;
    difference: number = 0;
    
    zoom: number = 16;
    distance: number = 0;

    heightInPixels = 0;
    constructor(private application: ApplicationRef) { }

    ngOnInit(): void {
        this.heightInPixels = window.innerHeight;
        this.options = {
            layers: [
                tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
            ],
            zoom: 16,
            center: latLng(40.8321432, 29.391122)
        };

    }

    //Harita ilk oluştuğunda bu fonksiyon çalışır.
    onMapReady = (map: any) => {
        this.map = map;

        map.addControl(map.zoomControl.setPosition('bottomright'));
        setTimeout(() => map.invalidateSize(), 300);

        map.pm.addControls({
            position: 'bottomright',
            drawCircle: false,
            drawCircleMarker: false,
            drawPolyline: true,
            drawRectangle: false,
            drawPolygon: false,
            editMode: false,
            dragMode: false,
            cutPolygon: false,
            removalMode: false,
            drawMarker: false,
            drawText: false,
            customControls: false,
            rotateMode: false,
            oneBlock: true,
        });

        //Çizime başlandı.
        this.map.on("pm:drawstart", (event: any) => {
            //nokta eklendiğinde diziye bu nokta kaydedilir.
            event.workingLayer.on("pm:vertexadded", (e: any) => {
                this.drawnLine.push(e.latlng);
            });
        });

        // Çizim bittiğinde hesaplama işlemi yapılır.
        this.map.on('pm:drawend', (e: any) => {
            this.calculate();
        });

        // Yeni bir çizime başlandığında değişkenler sıfırlanır.
        this.map.on('pm:drawstart', (e: any) => {
            this.resetUI();
        });

        // Çizim bittiğinde ve çizilen katman oluşturulduğunda o katman haritadan kaldırılır.
        // Elimizde noktalar olduğu için biz üretiyoruz, bu nedenle çizim sonrası eklenilen katman bizim için gereksiz.
        this.map.on('pm:create', (e: any) => {
            if (e.layer) map.removeLayer(e.layer);
        });
    }

    // Haritada zoom eventi bittiğinde tölerans değeri güncellenir.
    // Tolerans değiştikten sonra tekrardan hesaplama yapılır.
    zoomend = () => {
        this.zoom = this.map.getZoom();
        if (this.zoom == 16) this.tolerance = 0;
        else if (this.zoom == 15) this.tolerance = 10;
        else if (this.zoom == 14) this.tolerance = 20;
        else if (this.zoom == 13) this.tolerance = 30;
        else if (this.zoom == 12) this.tolerance = 40;
        else if (this.zoom == 11) this.tolerance = 50;
        else if (this.zoom == 10) this.tolerance = 60;
        else if (this.zoom == 9) this.tolerance = 70;
        else if (this.zoom == 8) this.tolerance = 80;
        else if (this.zoom == 7) this.tolerance = 90;
        else if (this.zoom == 6) this.tolerance = 100;
        this.calculate();
    }

    // Douglas&Peucker algoritması noktalar ve tölerans alır, hesaplama sonrası yeni noktaların dizisini döndürür.
    douglasPeucker = (points: any, tolerance: any): [number, number][] => {
        //Eğer nokta sayısı 3ten az ise hesaplama yapılmaz.
        if (points.length < 3) return points;
        
      
        // Başlangıç ve bitiş noktalarına bir çizgi çekilir maksimum mesafeye sahip nokta bulunur.
        let maxDistance = 0;
        let index = 0;

        for (let i = 1; i < points.length - 1; i++) {
            //Başlangıç ve bitiş noktaları belirlenir.
            const startPoint = points[0];
            const endPoint = points[points.length - 1];

            //Bu 2 nokta arasında bir çizgi çizilir.
            const turfLine = turf.lineString([[startPoint.lng, startPoint.lat], [endPoint.lng, endPoint.lat]]);
            //Bu 2 nokta arasında kalan diğer noktaların çizgiye olan uzaklıkları incelenir, en uzak noktan bulunur.
            const turfPoint = turf.point([points[i].lng, points[i].lat]);
            const distance = turf.pointToLineDistance(turfPoint, turfLine, { units: 'meters' });

            if (distance > maxDistance) {
                maxDistance = distance;
                index = i;
            }
        }

        // Eğer maksimum mesafe tölerans değerinden büyükse, bu noktayı basitleştir.
        if (maxDistance > tolerance) {
            // Aralıkları belirle.
            const firstSegment = this.douglasPeucker(points.slice(0, index + 1), tolerance);
            const secondSegment = this.douglasPeucker(points.slice(index), tolerance);
        
            // Aralıkları birleştir
            return firstSegment.slice(0, -1).concat(secondSegment);
        } else {
          // Eğer maksimum mesafe töleranstan küçükse noktayı döndür.
          return [points[0], points[points.length - 1]];
        }
    }

    calculate = () => {
        const simplifiedLine = this.douglasPeucker(this.drawnLine, this.tolerance);
        //İlk (yeşil) çizgimiz haritaya eklendi ve ikincinin arkasına alındı. Değişikliği görebilmek için çizikli şekilde haritaya eklendi.
        this.firstLine = polyline(this.drawnLine, { color: 'green', dashArray: '5, 10', pmIgnore: true, snapIgnore: false }).bringToBack();
        //Son (kırmızı) çizgimiz hesaplama sonrası oluşan çizgimiz.
        this.lastLine = polyline(simplifiedLine, { color: 'red', pmIgnore: true, snapIgnore: true });
        
        this.finalLine = simplifiedLine;
        //Nokta farkı hesaplanır.
        this.difference = this.drawnLine.length - this.finalLine.length;
    }

    resetUI = () => {
        this.firstLine = null;
        this.lastLine = null;
        this.tolerance = 100;
        this.drawnLine = [];
        this.finalLine = [];

        this.difference = 0;
    }
}
