import { Injectable, Inject }    from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Rx';

import { BaseUrlPipe } from './base-url.pipe';
import { HandlerPathPipe } from './handler-path.pipe';
import { CaptchaHelperService } from './captcha-helper.service';
import { CaptchaSettings } from './captcha-settings.interface';
import { CAPTCHA_SETTINGS } from './config';

declare var BotDetect: any;

@Injectable()
export class CaptchaService {

  private _styleName: string;
  private _botdetectInstance: any;

  constructor(
    private http: Http,
    private baseUrlPipe: BaseUrlPipe,
    private handlerPathPipe: HandlerPathPipe,
    private captchaHelper: CaptchaHelperService,
    @Inject(CAPTCHA_SETTINGS) private config: CaptchaSettings
  ) { }

  set styleName(styleName: string) {
    this._styleName = styleName;
  }

  get styleName(): string {
    return this._styleName;
  }

  /**
   * The captcha handler url for BotDetect requests.
   */
  get handlerUrl(): string {
    const baseUrl = this.baseUrlPipe.transform(this.config.baseUrl);
    const handlerPath = this.handlerPathPipe.transform(this.config.handlerPath);
    return baseUrl.concat(handlerPath);
  }

  /**
   * Get BotDetect instance, which is provided by BotDetect script.
   */
  get botdetectInstance(): any {
    if (!this.styleName) {
      return null;
    }

    // BotDetect instance not exist or exist but styleName not match
    if (!this._botdetectInstance
        || (this._botdetectInstance.captchaStyleName !== this.styleName)) {
      this._botdetectInstance = BotDetect.getInstanceByStyleName(this.styleName);
    }

    return this._botdetectInstance;
  }

  /**
   * Get captcha html markup from BotDetect API.
   */
  getHtml(): Observable<string> {
    const url = this.captchaHelper.buildUrl(this.handlerUrl, {
      get: 'html',
      c: this.styleName
    });

    return this.http.get(url)
      .map((response: Response) => response.text().replace(/<script.*<\/script>/g, ''))
      .catch((error: any) => Observable.throw(error.json().error));
  }

  /**
   * UI validate captcha.
   */
  validate(captchaCode: string): Observable<string> {
    if (!this.botdetectInstance) {
      throw new Error('BotDetect instance does not exist.');
    }

    const url = this.captchaHelper.buildUrl(this.botdetectInstance.validationUrl, {
      i: captchaCode
    });

    return this.http.get(url)
      .map((response: Response) => response.json())
      .catch((error: any) => Observable.throw(error.json().error));
  }

}
