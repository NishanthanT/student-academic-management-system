package Pages.Adminpage;

import Utility.BrowserDriver;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public class CreateSubject extends BrowserDriver {

    public static String generatedSubjectCode = "";
    public static String generatedSubjectName = "";
    public static String updatedSubjectName = "";

    public static WebElement waitForVisible(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public static WebElement waitForClickable(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clearInput(WebElement element) throws InterruptedException {
        element.click();
        element.sendKeys(Keys.chord(Keys.CONTROL, "a"));
        element.sendKeys(Keys.BACK_SPACE);
        Thread.sleep(500);
    }

    public static void scrollIntoView(WebElement element) throws InterruptedException {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({behavior:'instant', block:'center'});", element
        );
        Thread.sleep(1000);
    }

    public static String generateUniqueSubjectCode() {
        long time = System.currentTimeMillis();
        String lastFour = String.valueOf(time).substring(String.valueOf(time).length() - 4);
        return "IT" + lastFour;
    }

    public static String generateUniqueSubjectName() {
        long time = System.currentTimeMillis();
        return "Automation Subject " + time;
    }

    public static void clickCreateSubjectNavigationButton() throws InterruptedException {
        WebElement navBtn = waitForClickable(By.id("admin-nav-create-subject"));
        navBtn.click();
        Thread.sleep(2000);
        waitForVisible(By.id("createsubject-code-input"));
    }

    public static void enterNewSubjectDetails() throws InterruptedException {
        generatedSubjectCode = generateUniqueSubjectCode();
        generatedSubjectName = generateUniqueSubjectName();

        WebElement codeInput = waitForVisible(By.id("createsubject-code-input"));
        WebElement nameInput = waitForVisible(By.id("createsubject-name-input"));
        WebElement yearSelectElement = waitForVisible(By.id("createsubject-year-select"));
        WebElement semSelectElement = waitForVisible(By.id("createsubject-sem-select"));

        scrollIntoView(codeInput);

        clearInput(codeInput);
        clearInput(nameInput);

        codeInput.sendKeys(generatedSubjectCode);
        nameInput.sendKeys(generatedSubjectName);

        Select yearSelect = new Select(yearSelectElement);
        yearSelect.selectByValue("3");

        Select semSelect = new Select(semSelectElement);
        semSelect.selectByValue("2");

        Thread.sleep(1000);
    }

    public static void clickCreateSubjectSubmitButton() throws InterruptedException {
        WebElement createBtn = waitForClickable(By.id("createsubject-button-2"));
        scrollIntoView(createBtn);
        createBtn.click();
        Thread.sleep(3000);
    }

    // toast check இல்லாமல் created row table ல வந்துதானா check
    public static boolean isSubjectCreatedSuccessfully() {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
            wait.until(ExpectedConditions.visibilityOfElementLocated(
                    By.xpath("//table//tbody//tr[1]")
            ));

            return driver.findElements(
                    By.xpath("//table//tbody//tr//td[contains(.,'" + generatedSubjectCode + "') or contains(.,'" + generatedSubjectName + "')]")
            ).size() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static String getFirstRowSubjectId() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("tbody tr")));
        List<WebElement> editButtons = driver.findElements(By.cssSelector("button[id^='createsubject-button-edit-']"));
        String fullId = editButtons.get(0).getAttribute("id");
        return fullId.replace("createsubject-button-edit-", "");
    }

    public static void clickFirstRowSubjectEditButton() throws InterruptedException {
        String subjectId = getFirstRowSubjectId();
        WebElement editBtn = waitForClickable(By.id("createsubject-button-edit-" + subjectId));
        scrollIntoView(editBtn);
        editBtn.click();
        Thread.sleep(1500);
        waitForVisible(By.id("createsubject-button-7"));
    }

    public static void changeFirstRowSubjectNameAndSave() throws InterruptedException {
        updatedSubjectName = "Edited Subject " + System.currentTimeMillis();

        List<WebElement> inputs = driver.findElements(By.cssSelector("div.fixed input"));
        WebElement nameInput = inputs.get(1);

        scrollIntoView(nameInput);
        clearInput(nameInput);
        nameInput.sendKeys(updatedSubjectName);

        WebElement saveBtn = waitForClickable(By.id("createsubject-button-7"));
        scrollIntoView(saveBtn);
        saveBtn.click();
        Thread.sleep(3000);
    }

    public static boolean isSubjectUpdatedSuccessfully() {
        try {
            return driver.findElements(
                    By.xpath("//table//tbody//tr//td[contains(.,'" + updatedSubjectName + "')]")
            ).size() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public static void clickFirstRowSubjectDeleteButton() throws InterruptedException {
        String subjectId = getFirstRowSubjectId();
        WebElement deleteBtn = waitForClickable(By.id("createsubject-button-delete-" + subjectId));
        scrollIntoView(deleteBtn);
        deleteBtn.click();
        Thread.sleep(1500);
        waitForVisible(By.id("createsubject-button-9"));
    }

    public static void confirmSubjectDelete() throws InterruptedException {
        WebElement deleteConfirmBtn = waitForClickable(By.id("createsubject-button-9"));
        scrollIntoView(deleteConfirmBtn);
        deleteConfirmBtn.click();
        Thread.sleep(3000);
    }

    public static boolean isSubjectDeletedSuccessfully() {
        try {
            return driver.findElements(
                    By.xpath("//table//tbody//tr//td[contains(.,'" + updatedSubjectName + "')]")
            ).isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public static void filterSubjectsByYearAndSemester() throws InterruptedException {
        WebElement yearFilter = waitForVisible(By.id("createsubject-select-1"));
        scrollIntoView(yearFilter);

        Select yearSelect = new Select(yearFilter);
        yearSelect.selectByValue("3");
        Thread.sleep(1200);

        WebElement semFilter = waitForVisible(By.id("createsubject-select-2"));
        Select semSelect = new Select(semFilter);
        semSelect.selectByValue("2");
        Thread.sleep(1200);

        yearSelect.selectByValue("1");
        Thread.sleep(1200);

        semSelect.selectByValue("1");
        Thread.sleep(1200);

        yearSelect.selectByValue("all");
        Thread.sleep(1200);

        semSelect.selectByValue("all");
        Thread.sleep(1200);
    }
}