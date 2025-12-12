package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class Adminlogin extends BrowserDriver {
        public static String Xbaseurl="http://localhost:5173/";
        public static String Xdemoaccount="/html/body/div/div/div[2]/div[1]/div[2]/form/div[3]/button";
        public static String Xsigninbtn="/html/body/div/div/div[2]/div[1]/div[2]/form/button";

    public static void naviagtetoAdminLoginPageURL() throws InterruptedException {

            BrowserDriver.BrowserDriver(); // ensure driver is initialized
            driver.get(Xbaseurl);
            Thread.sleep(2000); // optional: replace with explicit wait
            driver.manage().window().maximize();
        }
    public static void clickdemoaccountbutton() throws InterruptedException {
        Thread.sleep(1500);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement imageElement = wait.until(ExpectedConditions.elementToBeClickable(By.xpath( Xdemoaccount)));
        imageElement.click();
    }
    public static void clicksignbutton() throws InterruptedException {
        Thread.sleep(1500);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement imageElement = wait.until(ExpectedConditions.elementToBeClickable(By.xpath(Xsigninbtn)));
        imageElement.click();
    }
}
