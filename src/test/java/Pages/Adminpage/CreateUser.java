package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class CreateUser extends BrowserDriver {

    public static String generatedStaffEmail = "";
    public static String generatedStudentEmail = "";
    public static final String defaultPassword = "Thaya0506@";

    public static WebElement waitForElement(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clearField(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static String generateUniqueEmail(String prefix) {
        long time = System.currentTimeMillis();
        return prefix + time + "@gmail.com";
    }

    public static void clickCreateUserNavigationButton() throws InterruptedException {
        WebElement createUserNav = waitForClickable(By.id("admin-nav-create-user"));
        createUserNav.click();
        Thread.sleep(2000);

        waitForElement(By.id("createuser-input-1"));
    }

    public static void clearCreateUserForm() throws InterruptedException {
        WebElement fullNameInput = waitForElement(By.id("createuser-input-1"));
        WebElement emailInput = waitForElement(By.id("createuser-input-2"));
        WebElement passwordInput = waitForElement(By.id("createuser-input-3"));

        clearField(fullNameInput);
        clearField(emailInput);
        clearField(passwordInput);
    }

    public static void enterNewStaffUserDetails() throws InterruptedException {
        clearCreateUserForm();

        generatedStaffEmail = generateUniqueEmail("staffuser");

        WebElement fullNameInput = waitForElement(By.id("createuser-input-1"));
        WebElement emailInput = waitForElement(By.id("createuser-input-2"));
        WebElement passwordInput = waitForElement(By.id("createuser-input-3"));
        WebElement roleSelectElement = waitForElement(By.id("createuser-select-1"));

        fullNameInput.sendKeys("Automation Staff User");
        emailInput.sendKeys(generatedStaffEmail);
        passwordInput.sendKeys(defaultPassword);

        Select roleSelect = new Select(roleSelectElement);
        roleSelect.selectByValue("staff");

        Thread.sleep(1000);
    }

    public static void enterNewStudentUserDetails() throws InterruptedException {
        clearCreateUserForm();

        generatedStudentEmail = generateUniqueEmail("studentuser");

        WebElement fullNameInput = waitForElement(By.id("createuser-input-1"));
        WebElement emailInput = waitForElement(By.id("createuser-input-2"));
        WebElement passwordInput = waitForElement(By.id("createuser-input-3"));
        WebElement roleSelectElement = waitForElement(By.id("createuser-select-1"));

        fullNameInput.sendKeys("Automation Student User");
        emailInput.sendKeys(generatedStudentEmail);
        passwordInput.sendKeys(defaultPassword);

        Select roleSelect = new Select(roleSelectElement);
        roleSelect.selectByValue("student");

        Thread.sleep(1000);

        WebElement yearSelectElement = waitForElement(By.id("createuser-select-2"));
        WebElement semesterSelectElement = waitForElement(By.id("createuser-select-3"));

        Select yearSelect = new Select(yearSelectElement);
        yearSelect.selectByValue("3");

        Select semesterSelect = new Select(semesterSelectElement);
        semesterSelect.selectByValue("2");

        Thread.sleep(1000);
    }

    public static void clickCreateUserSubmitButton() throws InterruptedException {
        WebElement createUserButton = waitForClickable(By.id("createuser-button-1"));
        createUserButton.click();
        Thread.sleep(2500);
    }

    public static String getToastMessage() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement toast = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.xpath("//div[contains(@class,'fixed top-10 right-10')]")
                )
        );
        return toast.getText().trim();
    }
}