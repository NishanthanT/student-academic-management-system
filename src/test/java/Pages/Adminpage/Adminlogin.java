package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.time.Duration;

public class Adminlogin extends BrowserDriver {

    public static String baseUrl = "http://localhost:5173/";
    public static String downloadPath = System.getProperty("user.dir") + "\\downloads";

    public static void naviagtetoAdminLoginPageURL() throws InterruptedException {
        BrowserDriver.BrowserDriver();
        driver.get(baseUrl);
        driver.manage().window().maximize();
        Thread.sleep(2000);
    }

    public static WebElement getEmailInput() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email")));
    }

    public static WebElement getPasswordInput() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-password")));
    }

    public static WebElement getLoginButton() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        return wait.until(ExpectedConditions.elementToBeClickable(By.id("login-submit-btn")));
    }

    public static void clearField(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void clearLoginFields() throws InterruptedException {
        WebElement emailInput = getEmailInput();
        WebElement passwordInput = getPasswordInput();

        clearField(emailInput);
        clearField(passwordInput);
    }

    public static void enterInvalidEmailAndValidPassword() throws InterruptedException {
        WebElement emailInput = getEmailInput();
        WebElement passwordInput = getPasswordInput();

        clearField(emailInput);
        emailInput.sendKeys("wrongemail@gmail.com");

        clearField(passwordInput);
        passwordInput.sendKeys("Thaya0506@");

        Thread.sleep(1000);
    }

    public static void enterValidEmailAndInvalidPassword() throws InterruptedException {
        WebElement emailInput = getEmailInput();
        WebElement passwordInput = getPasswordInput();

        clearField(emailInput);
        emailInput.sendKeys("thayalannishanthan@gmail.com");

        clearField(passwordInput);
        passwordInput.sendKeys("WrongPassword123");

        Thread.sleep(1000);
    }

    public static void enterValidEmailAndValidPassword() throws InterruptedException {
        WebElement emailInput = getEmailInput();
        WebElement passwordInput = getPasswordInput();

        clearField(emailInput);
        emailInput.sendKeys("thayalannishanthan@gmail.com");

        clearField(passwordInput);
        passwordInput.sendKeys("Thaya0506@");

        Thread.sleep(1000);
    }

    public static void clickLoginButton() throws InterruptedException {
        WebElement loginBtn = getLoginButton();
        loginBtn.click();
        Thread.sleep(2000);
    }

    public static boolean isInvalidCredentialsMessageDisplayed() {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            WebElement errorMessage = wait.until(
                    ExpectedConditions.visibilityOfElementLocated(
                            By.xpath("//*[contains(text(),'Invalid credentials')]")
                    )
            );
            return errorMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isAdminDashboardLoaded() {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
            wait.until(ExpectedConditions.urlContains("/admin"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickExportPdfButton() throws InterruptedException {
        Thread.sleep(3000);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement exportBtn = wait.until(
                ExpectedConditions.elementToBeClickable(
                        By.xpath("//button[contains(.,'EXPORT PDF') or contains(.,'Export PDF')]")
                )
        );

        exportBtn.click();
        Thread.sleep(5000);
    }

    public static boolean isPdfDownloadedSuccessfully() {
        File folder = new File(downloadPath);

        if (!folder.exists()) {
            return false;
        }

        File[] files = folder.listFiles();
        if (files == null) {
            return false;
        }

        for (File file : files) {
            if (file.getName().toLowerCase().endsWith(".pdf")) {
                System.out.println("Downloaded PDF found: " + file.getName());
                return true;
            }
        }

        return false;
    }
}