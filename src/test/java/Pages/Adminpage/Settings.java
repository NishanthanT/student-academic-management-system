package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class Settings extends BrowserDriver {

    public static String systemName = "NU";
    public static String logoPath = "C:\\Users\\thaya\\OneDrive\\Desktop\\Y3S2\\ITPM\\OIP (5).jpeg";

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});",
                element
        );
        Thread.sleep(800);
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void clickSettingsNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("admin-nav-settings"));
        navBtn.click();
        Thread.sleep(2000);
        waitForVisible(By.id("settings-input-1"));
    }

    public static void updateSystemName() throws InterruptedException {
        WebElement systemNameInput = waitForVisible(By.id("settings-input-1"));
        scrollIntoView(systemNameInput);
        clearInput(systemNameInput);
        systemNameInput.sendKeys(systemName);
        Thread.sleep(1000);
    }

    public static void uploadSystemLogo() throws InterruptedException {
        WebElement logoInput = waitForVisible(By.id("settings-input-2"));
        scrollIntoView(logoInput);
        logoInput.sendKeys(logoPath);
        Thread.sleep(1500);
    }

    public static void clickTemporarySliderToggle() throws InterruptedException {
        WebElement toggleInput = waitForVisible(By.id("settings-input-3"));
        scrollIntoView(toggleInput);

        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", toggleInput);
        Thread.sleep(1000);
    }

    public static void clickSaveSettingsButton() throws InterruptedException {
        WebElement saveBtn = waitForClickable(By.id("settings-button-2"));
        scrollIntoView(saveBtn);
        saveBtn.click();
        Thread.sleep(2500);
    }

    public static boolean isSettingsSavedSuccessfully() {
        try {
            // success alert check
            return driver.findElements(
                    By.xpath("//*[contains(text(),'Settings updated successfully')]")
            ).size() > 0;
        } catch (Exception e) {
            return false;
        }
    }
}