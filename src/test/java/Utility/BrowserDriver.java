package Utility;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;




public class BrowserDriver {
    public static WebDriver driver;
    public static ChromeOptions options;
     public static void BrowserDriver(){
         WebDriverManager.chromedriver().driverVersion("140.0.7339.81").setup();
         options = new ChromeOptions();
         options.addArguments("--remote-allow-origins=*");
         options.addArguments("--remote-allow-origins=*");
         options.addArguments("--disable-dev-shm-usage");
         options.addArguments("--no-sandbox");
         options.addArguments("--disable-gpu");
         System.setProperty("webdriver.http.factory","jdk-http-client");
         options.setBinary("C:\\Users\\ASUS\\Desktop\\WDS_ADMIN_PAGE\\wds_uat_selenium_automation\\src\\test\\resources\\driver\\chromedriver1.exe");

         System.setProperty("webdriver.chrome.driver", System.getProperty("user.dir") + "/src/test/resources/driver/chromedriver1.exe");
             driver = new ChromeDriver();
             driver.get("http://localhost:5173/");



     }

    public static void close(){
        if (driver != null) {
            driver.quit();
        }    }
}
